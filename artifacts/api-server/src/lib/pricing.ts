import { pool } from "@workspace/db";

export const DEFAULT_LINK_COST = 500;

export async function ensurePricingTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(
    `INSERT INTO app_settings (key, value) VALUES ('link_price', $1) ON CONFLICT (key) DO NOTHING`,
    [String(DEFAULT_LINK_COST)],
  );
}

export async function getLinkCost() {
  try {
    const result = await pool.query(`SELECT value FROM app_settings WHERE key = 'link_price'`);
    const value = Number(result.rows[0]?.value);
    return Number.isInteger(value) && value > 0 ? value : DEFAULT_LINK_COST;
  } catch {
    return DEFAULT_LINK_COST;
  }
}