import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const userId = typeof payload === "string" ? NaN : Number(payload.sub);
    if (!Number.isInteger(userId) || userId <= 0) {
      res.status(401).json({ error: "Invalid or expired token" });
      return;
    }
    (req as any).userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
