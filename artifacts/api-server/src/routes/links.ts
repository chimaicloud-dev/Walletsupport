import { Router } from "express";
import { db, chatLinksTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const links = await db.select().from(chatLinksTable).where(eq(chatLinksTable.ownerId, userId));
  res.json(links.map(l => ({
    id: l.id,
    slug: l.slug,
    label: l.label,
    customName: l.customName ?? null,
    createdAt: l.createdAt.toISOString(),
  })));
});

router.post("/", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const { slug, label, customName } = req.body;

  if (!slug || typeof slug !== "string" || !slug.trim()) {
    res.status(400).json({ error: "A URL slug is required." });
    return;
  }

  const safeSlug = slug.toLowerCase().replace(/[^a-z0-9_-]/g, "-");

  try {
    const [link] = await db.insert(chatLinksTable).values({
      ownerId: userId,
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
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  const { customName, label } = req.body;

  const updateData: Record<string, any> = {};
  if (customName !== undefined) updateData.customName = customName?.trim() || null;
  if (label !== undefined) updateData.label = label;

  const [link] = await db.update(chatLinksTable)
    .set(updateData)
    .where(and(eq(chatLinksTable.id, id), eq(chatLinksTable.ownerId, userId)))
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
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  await db.delete(chatLinksTable).where(and(eq(chatLinksTable.id, id), eq(chatLinksTable.ownerId, userId)));
  res.json({ success: true });
});

export default router;
