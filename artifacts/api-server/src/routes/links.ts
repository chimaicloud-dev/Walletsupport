import { Router } from "express";
import { db, chatLinksTable, usersTable, tokenTransactionsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();
const TOKEN_COST = 1; // tokens per link

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

  // Check token balance
  const [user] = await db.select({ tokenBalance: usersTable.tokenBalance }).from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.tokenBalance < TOKEN_COST) {
    res.status(402).json({
      error: "Insufficient tokens. You need at least 1 token (₦300) to create a link.",
      tokenBalance: user?.tokenBalance ?? 0,
    });
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

    // Deduct token and record transaction
    await db.update(usersTable)
      .set({ tokenBalance: sql`${usersTable.tokenBalance} - ${TOKEN_COST}` })
      .where(eq(usersTable.id, userId));

    await db.insert(tokenTransactionsTable).values({
      userId,
      amount: -TOKEN_COST,
      type: "link_created",
      note: `Link created: /c/${safeSlug}`,
    });

    const [updated] = await db.select({ tokenBalance: usersTable.tokenBalance }).from(usersTable).where(eq(usersTable.id, userId));

    res.status(201).json({
      id: link.id,
      slug: link.slug,
      label: link.label,
      customName: link.customName ?? null,
      createdAt: link.createdAt.toISOString(),
      tokenBalance: updated.tokenBalance,
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

  if (!link) { res.status(404).json({ error: "Link not found" }); return; }

  res.json({ id: link.id, slug: link.slug, label: link.label, customName: link.customName ?? null, createdAt: link.createdAt.toISOString() });
});

router.delete("/:id", requireAuth, async (req, res) => {
  const userId = (req as any).userId as number;
  const id = parseInt(req.params.id as string);
  await db.delete(chatLinksTable).where(and(eq(chatLinksTable.id, id), eq(chatLinksTable.ownerId, userId)));
  res.json({ success: true });
});

export default router;
