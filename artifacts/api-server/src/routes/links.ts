import { Router } from "express";
import { db, usersTable, chatLinksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.json([]);
    return;
  }
  const links = await db.select().from(chatLinksTable).where(eq(chatLinksTable.ownerId, user.id));
  res.json(links.map(l => ({
    id: l.id,
    slug: l.slug,
    label: l.label,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const { slug, label } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  const existing = await db.select().from(chatLinksTable).where(eq(chatLinksTable.slug, safeSlug));
  if (existing.length > 0) {
    res.status(409).json({ error: "That link slug is already taken. Try a different one." });
    return;
  }

  const [link] = await db.insert(chatLinksTable).values({
    ownerId: user.id,
    slug: safeSlug,
    label,
  }).returning();

  res.status(201).json({
    id: link.id,
    slug: link.slug,
    label: link.label,
    createdAt: link.createdAt.toISOString(),
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const id = parseInt(req.params.id);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db.delete(chatLinksTable).where(and(eq(chatLinksTable.id, id), eq(chatLinksTable.ownerId, user.id)));
  res.json({ success: true });
});

export default router;
