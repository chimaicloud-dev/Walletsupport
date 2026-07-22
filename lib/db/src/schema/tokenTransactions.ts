import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const tokenTransactionsTable = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  type: text("type").notNull(), // 'admin_credit' | 'link_created'
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type TokenTransaction = typeof tokenTransactionsTable.$inferSelect;
