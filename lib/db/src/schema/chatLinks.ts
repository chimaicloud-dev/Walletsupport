import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const chatLinksTable = pgTable("chat_links", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull().references(() => usersTable.id),
  slug: text("slug").notNull().unique(),
  label: text("label").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChatLinkSchema = createInsertSchema(chatLinksTable).omit({ id: true, createdAt: true });
export type InsertChatLink = z.infer<typeof insertChatLinkSchema>;
export type ChatLink = typeof chatLinksTable.$inferSelect;
