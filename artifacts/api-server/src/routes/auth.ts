import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const SALT_ROUNDS = 10;

router.post("/register", async (req, res) => {
  const { email, password, handle, displayName } = req.body;
  if (!email || !password || !handle || !displayName) {
    res.status(400).json({ error: "email, password, handle, and displayName are required" });
    return;
  }
  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }
  try {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const [user] = await db
      .insert(usersTable)
      .values({ email: email.toLowerCase().trim(), passwordHash, handle: handle.trim(), displayName: displayName.trim() })
      .returning();
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    res.status(201).json({
      token,
      user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName, bio: user.bio ?? null, avatarUrl: user.avatarUrl ?? null },
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "That email or handle is already taken" });
      return;
    }
    console.error("Registration error:", err);
    res.status(500).json({ error: "Registration failed. Please try again." });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: "email and password are required" });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase().trim()));
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    const token = jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: "30d" });
    res.json({
      token,
      user: { id: user.id, email: user.email, handle: user.handle, displayName: user.displayName, bio: user.bio ?? null, avatarUrl: user.avatarUrl ?? null },
    });
  } catch (err: any) {
    console.error("Login error:", err?.message ?? err);
    res.status(500).json({ error: "Login failed. Please check your credentials and try again." });
  }
});

export default router;
