import { Router, type IRouter } from "express";
import { pool } from "@workspace/db";

const router: IRouter = Router();

// One-time database migration endpoint.
// Visit /api/setup-db to apply the correct schema to the Vercel database.
// Safe to run multiple times (uses IF NOT EXISTS / DROP IF EXISTS).
router.get("/setup-db", async (_req, res) => {
  try {
    await pool.query(`
      -- Drop old tables (old Clerk-based schema) in dependency order
      DROP TABLE IF EXISTS messages CASCADE;
      DROP TABLE IF EXISTS chat_links CASCADE;
      DROP TABLE IF EXISTS conversations CASCADE;
      DROP TABLE IF EXISTS users CASCADE;

      -- users (JWT auth: email + password_hash)
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        email         TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        handle        TEXT NOT NULL UNIQUE,
        display_name  TEXT NOT NULL,
        bio           TEXT,
        avatar_url    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- conversations
      CREATE TABLE IF NOT EXISTS conversations (
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
      );

      -- messages
      CREATE TABLE IF NOT EXISTS messages (
        id              SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        sender_type     TEXT NOT NULL,
        content         TEXT NOT NULL,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- chat_links
      CREATE TABLE IF NOT EXISTS chat_links (
        id          SERIAL PRIMARY KEY,
        owner_id    INTEGER NOT NULL REFERENCES users(id),
        slug        TEXT NOT NULL UNIQUE,
        label       TEXT NOT NULL,
        custom_name TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    res.json({ status: "ok", message: "Database schema applied successfully." });
  } catch (err: any) {
    res.status(500).json({ status: "error", error: err?.message ?? String(err) });
  }
});

export default router;
