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
    customName: l.customName ?? null,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const { slug, label, customName } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!slug || typeof slug !== "string" || !slug.trim()) {
    res.status(400).json({ error: "A URL slug is required." });
    return;
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  try {
    const [link] = await db.insert(chatLinksTable).values({
      ownerId: user.id,
      slug: safeSlug,
      label,
      customName: customName?.trim() || null,
    }).returning();

    res.status(201).json({
      id: link.id,
      slug: link.slug,
      label: link.label,
      customName: link.customName ?? null,
      createdAt: link.createdAt.toISOString(),
    });
  } catch (err: any) {
    if (err?.code === "23505") {
      res.status(409).json({ error: "That link slug is already taken. Try a different one." });
      return;
    }
    console.error("Failed to create chat link:", err);
    res.status(500).json({ error: "Something went wrong creating the link. Please try again." });
  }
});

router.put("/:id", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const id = parseInt(req.params.id as string);
  const { customName, label } = req.body;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const updateData: Record<string, any> = {};
  if (customName !== undefined) updateData.customName = customName?.trim() || null;
  if (label !== undefined) updateData.label = label;

  const [link] = await db.update(chatLinksTable)
    .set(updateData)
    .where(and(eq(chatLinksTable.id, id), eq(chatLinksTable.ownerId, user.id)))
    .returning();

  if (!link) {
    res.status(404).json({ error: "Link not found" });
    return;
  }

  res.json({
    id: link.id,
    slug: link.slug,
    label: link.label,
    customName: link.customName ?? null,
    createdAt: link.createdAt.toISOString(),
  });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const id = parseInt(req.params.id as string);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  await db.delete(chatLinksTable).where(and(eq(chatLinksTable.id, id), eq(chatLinksTable.ownerId, user.id)));
  res.json({ success: true });
});

export default router;
