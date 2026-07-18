import { Router } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";
import { randomBytes } from "crypto";

const router = Router();

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

router.get("/stats", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;

  const allConvs = await db.select().from(conversationsTable).where(eq(conversationsTable.ownerId, userId));
  const total = allConvs.length;
  const unread = allConvs.filter(c => !c.isRead).length;
  const open = allConvs.filter(c => c.status === "open").length;
  const closed = allConvs.filter(c => c.status === "closed").length;

  res.json({ total, unread, open, closed });
});

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;

  const convs = await db.select().from(conversationsTable)
    .where(eq(conversationsTable.ownerId, userId))
    .orderBy(desc(conversationsTable.lastMessageAt));

  const result = await Promise.all(convs.map(async (c) => {
    const msgs = await db.select({ id: messagesTable.id }).from(messagesTable).where(eq(messagesTable.conversationId, c.id));
    return {
      id: c.id,
      guestName: c.guestName,
      guestEmail: c.guestEmail ?? null,
      subject: c.subject,
      status: c.status,
      isRead: c.isRead,
      lastMessageAt: c.lastMessageAt.toISOString(),
      messageCount: msgs.length,
      createdAt: c.createdAt.toISOString(),
    };
  }));

  res.json(result);
});

router.get("/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);

  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.ownerId, userId)));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const msgs = await db.select({ id: messagesTable.id }).from(messagesTable).where(eq(messagesTable.conversationId, id));

  res.json({
    id: conv.id,
    guestName: conv.guestName,
    guestEmail: conv.guestEmail ?? null,
    subject: conv.subject,
    status: conv.status,
    isRead: conv.isRead,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    messageCount: msgs.length,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.post("/:id/read", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);

  const [conv] = await db.update(conversationsTable)
    .set({ isRead: true })
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.ownerId, userId)))
    .returning();

  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const msgs = await db.select({ id: messagesTable.id }).from(messagesTable).where(eq(messagesTable.conversationId, id));

  res.json({
    id: conv.id,
    guestName: conv.guestName,
    guestEmail: conv.guestEmail ?? null,
    subject: conv.subject,
    status: conv.status,
    isRead: conv.isRead,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    messageCount: msgs.length,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/:id/messages", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);

  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.ownerId, userId)));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, id))
    .orderBy(messagesTable.createdAt);

  res.json(msgs.map(m => ({
    id: m.id,
    conversationId: m.conversationId,
    senderType: m.senderType,
    content: m.content,
    createdAt: m.createdAt.toISOString(),
  })));
});

router.post("/:id/messages", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  const { content } = req.body;

  const [conv] = await db.select().from(conversationsTable)
    .where(and(eq(conversationsTable.id, id), eq(conversationsTable.ownerId, userId)));
  if (!conv) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: id,
    senderType: "owner",
    content,
  }).returning();

  await db.update(conversationsTable)
    .set({ lastMessageAt: new Date(), isRead: true })
    .where(eq(conversationsTable.id, id));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderType: msg.senderType,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  });
});

export { generateToken };
export default router;
