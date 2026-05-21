import { Router } from "express";
import { db, usersTable, conversationsTable, messagesTable, chatLinksTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

const router = Router();

function generateToken(): string {
  return randomBytes(24).toString("hex");
}

router.get("/:handle", async (req, res) => {
  const { handle } = req.params;
  if (handle === "conversations" || handle === "link") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.handle, handle));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
  });
});

router.post("/:handle/contact", async (req, res) => {
  const { handle } = req.params;
  if (handle === "conversations" || handle === "link") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  const { guestName, message } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.handle, handle));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const token = generateToken();
  const subject = `Chat with ${guestName}`;

  const [conv] = await db.insert(conversationsTable).values({
    ownerId: user.id,
    guestName,
    guestEmail: null,
    subject,
    token,
    status: "open",
    isRead: false,
    agentName: null,
  }).returning();

  await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderType: "guest",
    content: message,
  });

  res.status(201).json({
    id: conv.id,
    token: conv.token,
    subject: conv.subject,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/link/:slug", async (req, res) => {
  const { slug } = req.params;
  const [link] = await db.select().from(chatLinksTable).where(eq(chatLinksTable.slug, slug));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, link.ownerId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    handle: user.handle,
    displayName: link.customName?.trim() || user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
  });
});

router.post("/link/:slug/contact", async (req, res) => {
  const { slug } = req.params;
  const { guestName, message } = req.body;

  const [link] = await db.select().from(chatLinksTable).where(eq(chatLinksTable.slug, slug));
  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, link.ownerId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const token = generateToken();
  const subject = `Chat with ${guestName}`;
  const agentName = link.customName?.trim() || null;

  const [conv] = await db.insert(conversationsTable).values({
    ownerId: user.id,
    guestName,
    guestEmail: null,
    subject,
    token,
    status: "open",
    isRead: false,
    agentName,
  }).returning();

  await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderType: "guest",
    content: message,
  });

  res.status(201).json({
    id: conv.id,
    token: conv.token,
    subject: conv.subject,
    createdAt: conv.createdAt.toISOString(),
  });
});

router.get("/conversations/:token", async (req, res) => {
  const { token } = req.params;
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.token, token));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [owner] = await db.select().from(usersTable).where(eq(usersTable.id, conv.ownerId));

  const msgs = await db.select().from(messagesTable)
    .where(eq(messagesTable.conversationId, conv.id))
    .orderBy(messagesTable.createdAt);

  res.json({
    id: conv.id,
    subject: conv.subject,
    guestName: conv.guestName,
    ownerDisplayName: conv.agentName || owner?.displayName || "Support",
    messages: msgs.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      senderType: m.senderType,
      content: m.content,
      createdAt: m.createdAt.toISOString(),
    })),
    createdAt: conv.createdAt.toISOString(),
  });
});

router.post("/conversations/:token/messages", async (req, res) => {
  const { token } = req.params;
  const { content } = req.body;

  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.token, token));
  if (!conv) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: conv.id,
    senderType: "guest",
    content,
  }).returning();

  await db.update(conversationsTable)
    .set({ lastMessageAt: new Date(), isRead: false })
    .where(eq(conversationsTable.id, conv.id));

  res.status(201).json({
    id: msg.id,
    conversationId: msg.conversationId,
    senderType: msg.senderType,
    content: msg.content,
    createdAt: msg.createdAt.toISOString(),
  });
});

export default router;
