import { Router } from "express";
import { db, adminsTable, usersTable, chatLinksTable, conversationsTable, walletTransactionsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const LINK_COST = 300;

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) { res.status(400).json({ error: "Email and password are required" }); return; }
  try {
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email.toLowerCase().trim()));
    if (!admin) { res.status(401).json({ error: "Invalid credentials" }); return; }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) { res.status(401).json({ error: "Invalid credentials" }); return; }
    const token = jwt.sign({ sub: admin.id, email: admin.email, role: "admin" }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, admin: { id: admin.id, email: admin.email } });
  } catch (err) {
    console.error("Admin login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// Dashboard stats
router.get("/stats", requireAdmin, async (_req, res) => {
  try {
    const [uc] = await db.select({ count: count() }).from(usersTable);
    const [lc] = await db.select({ count: count() }).from(chatLinksTable);
    const [cc] = await db.select({ count: count() }).from(conversationsTable);
    // Total naira ever credited
    const credited = await db.select({ total: sql<number>`COALESCE(SUM(amount), 0)` })
      .from(walletTransactionsTable).where(sql`amount > 0`);
    res.json({
      totalUsers: Number(uc.count),
      totalLinks: Number(lc.count),
      totalConversations: Number(cc.count),
      totalCredited: Number(credited[0]?.total ?? 0),
    });
  } catch { res.status(500).json({ error: "Failed to fetch stats" }); }
});

// List all users
router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id, email: usersTable.email, handle: usersTable.handle,
      displayName: usersTable.displayName, walletBalance: usersTable.walletBalance,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(users.map(u => ({
      ...u,
      linksAvailable: Math.floor(u.walletBalance / LINK_COST),
      createdAt: u.createdAt.toISOString(),
    })));
  } catch { res.status(500).json({ error: "Failed to fetch users" }); }
});

// Credit naira to a user's wallet
router.post("/users/:id/credit", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  const { amount, note } = req.body;
  if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
    res.status(400).json({ error: "Amount must be a positive integer (Naira)" });
    return;
  }
  try {
    const [user] = await db.select({ walletBalance: usersTable.walletBalance, displayName: usersTable.displayName })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    await db.update(usersTable)
      .set({ walletBalance: sql`${usersTable.walletBalance} + ${amount}` })
      .where(eq(usersTable.id, userId));

    await db.insert(walletTransactionsTable).values({
      userId, amount, type: "admin_credit",
      note: note?.trim() || `Admin credited ₦${amount}`,
    });

    const [updated] = await db.select({ walletBalance: usersTable.walletBalance })
      .from(usersTable).where(eq(usersTable.id, userId));

    res.json({
      success: true,
      newBalance: updated.walletBalance,
      linksAvailable: Math.floor(updated.walletBalance / LINK_COST),
    });
  } catch { res.status(500).json({ error: "Failed to credit wallet" }); }
});

// Get wallet transactions for a user
router.get("/users/:id/transactions", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  try {
    const txns = await db.select().from(walletTransactionsTable)
      .where(eq(walletTransactionsTable.userId, userId))
      .orderBy(desc(walletTransactionsTable.createdAt));
    res.json(txns.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
  } catch { res.status(500).json({ error: "Failed to fetch transactions" }); }
});

// Delete a user
router.delete("/users/:id", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  try {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch { res.status(500).json({ error: "Failed to delete user" }); }
});

export default router;
