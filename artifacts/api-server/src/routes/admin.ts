import { Router } from "express";
import { db, adminsTable, usersTable, chatLinksTable, conversationsTable, tokenTransactionsTable } from "@workspace/db";
import { eq, desc, count, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middlewares/requireAdmin";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

// Admin login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }
  try {
    const [admin] = await db.select().from(adminsTable).where(eq(adminsTable.email, email.toLowerCase().trim()));
    if (!admin) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
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
    res.json({
      totalUsers: Number(uc.count),
      totalLinks: Number(lc.count),
      totalConversations: Number(cc.count),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// List all users
router.get("/users", requireAdmin, async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      handle: usersTable.handle,
      displayName: usersTable.displayName,
      tokenBalance: usersTable.tokenBalance,
      createdAt: usersTable.createdAt,
    }).from(usersTable).orderBy(desc(usersTable.createdAt));
    res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Add tokens to a user
router.post("/users/:id/tokens", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  const { amount, note } = req.body;
  if (!amount || typeof amount !== "number" || amount <= 0 || !Number.isInteger(amount)) {
    res.status(400).json({ error: "Amount must be a positive integer" });
    return;
  }
  try {
    const [user] = await db.select({ tokenBalance: usersTable.tokenBalance, displayName: usersTable.displayName })
      .from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { res.status(404).json({ error: "User not found" }); return; }

    await db.update(usersTable)
      .set({ tokenBalance: sql`${usersTable.tokenBalance} + ${amount}` })
      .where(eq(usersTable.id, userId));

    await db.insert(tokenTransactionsTable).values({
      userId,
      amount,
      type: "admin_credit",
      note: note?.trim() || `Admin credited ${amount} token(s)`,
    });

    const [updated] = await db.select({ tokenBalance: usersTable.tokenBalance }).from(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true, newBalance: updated.tokenBalance });
  } catch {
    res.status(500).json({ error: "Failed to add tokens" });
  }
});

// Get token transactions for a user
router.get("/users/:id/transactions", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  try {
    const txns = await db.select().from(tokenTransactionsTable)
      .where(eq(tokenTransactionsTable.userId, userId))
      .orderBy(desc(tokenTransactionsTable.createdAt));
    res.json(txns.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })));
  } catch {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

// Delete a user
router.delete("/users/:id", requireAdmin, async (req, res) => {
  const userId = parseInt(req.params.id as string);
  try {
    await db.delete(usersTable).where(eq(usersTable.id, userId));
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
