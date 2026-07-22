import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";

const router: IRouter = Router();

router.get("/setup-db", async (_req, res) => {
  const steps: string[] = [];
  try {
    // Drop in dependency order
    await pool.query("DROP TABLE IF EXISTS token_transactions CASCADE");
    steps.push("dropped token_transactions");
    await pool.query("DROP TABLE IF EXISTS messages CASCADE");
    steps.push("dropped messages");
    await pool.query("DROP TABLE IF EXISTS chat_links CASCADE");
    steps.push("dropped chat_links");
    await pool.query("DROP TABLE IF EXISTS conversations CASCADE");
    steps.push("dropped conversations");
    await pool.query("DROP TABLE IF EXISTS users CASCADE");
    steps.push("dropped users");
    await pool.query("DROP TABLE IF EXISTS admins CASCADE");
    steps.push("dropped admins");

    await pool.query(`
      CREATE TABLE users (
        id            SERIAL PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        handle        TEXT NOT NULL UNIQUE,
        display_name  TEXT NOT NULL,
        bio           TEXT,
        avatar_url    TEXT,
        token_balance INTEGER NOT NULL DEFAULT 0,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    steps.push("created users");

    await pool.query(`
      CREATE TABLE admins (
        id            SERIAL PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    steps.push("created admins");

    await pool.query(`
      CREATE TABLE conversations (
        id              SERIAL PRIMARY KEY,
        owner_id        INTEGER NOT NULL REFERENCES users(id),
        guest_name      TEXT NOT NULL,
        guest_email     TEXT,
        subject         TEXT NOT NULL,
        agent_name      TEXT,
        status          TEXT NOT NULL DEFAULT 'open',
        is_read         BOOLEAN NOT NULL DEFAULT false,
        token           TEXT NOT NULL UNIQUE,
        last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    steps.push("created conversations");

    await pool.query(`
      CREATE TABLE messages (
        id              SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        sender_type     TEXT NOT NULL,
        content         TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    steps.push("created messages");

    await pool.query(`
      CREATE TABLE chat_links (
        id          SERIAL PRIMARY KEY,
        owner_id    INTEGER NOT NULL REFERENCES users(id),
        slug        TEXT NOT NULL UNIQUE,
        label       TEXT NOT NULL,
        custom_name TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    steps.push("created chat_links");

    await pool.query(`
      CREATE TABLE token_transactions (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        amount     INTEGER NOT NULL,
        type       TEXT NOT NULL,
        note       TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    steps.push("created token_transactions");

    // Seed admin account
    const adminHash = await bcrypt.hash("Chima@2025", 10);
    await pool.query(
      `INSERT INTO admins (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
      ["alexaaraya.34a@gmail.com", adminHash]
    );
    steps.push("seeded admin user");

    res.json({ status: "ok", message: "Database schema applied successfully.", steps });
  } catch (err: any) {
    res.status(500).json({
      status: "error",
      error: err?.message ?? String(err),
      code: err?.code,
      detail: err?.detail,
      dbUrlSet: !!process.env.DATABASE_URL || !!process.env.POSTGRES_URL,
      completedSteps: steps,
    });
  }
});

export default router;
