import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/requireAuth";

const router = Router();

router.get("/me", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));
  if (!user) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    handle: user.handle,
    displayName: user.displayName,
    bio: user.bio ?? null,
    avatarUrl: user.avatarUrl ?? null,
    createdAt: user.createdAt.toISOString(),
  });
});

router.put("/me", requireAuth, async (req, res) => {
  const clerkUserId = (req as any).clerkUserId;
  const { handle, displayName, bio } = req.body;

  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkUserId));

  if (existing.length === 0) {
    const [user] = await db.insert(usersTable).values({
      clerkId: clerkUserId,
      handle,
      displayName,
      bio: bio || null,
    }).returning();
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio ?? null,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } else {
    const [user] = await db.update(usersTable)
      .set({ handle, displayName, bio: bio || null })
      .where(eq(usersTable.clerkId, clerkUserId))
      .returning();
    res.json({
      id: user.id,
      clerkId: user.clerkId,
      handle: user.handle,
      displayName: user.displayName,
      bio: user.bio ?? null,
      avatarUrl: user.avatarUrl ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  }
});

router.get("/:handle", async (req, res) => {
  const { handle } = req.params;
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

export default router;
