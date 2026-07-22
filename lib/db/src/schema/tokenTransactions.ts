import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Logs all wallet credits (admin top-ups) and debits (link creation)
export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // positive = credit (Naira), negative = debit (Naira)
  type: text("type").notNull(), // 'admin_credit' | 'link_created'
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
