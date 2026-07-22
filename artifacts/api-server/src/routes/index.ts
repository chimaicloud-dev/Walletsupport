import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import conversationsRouter from "./conversations";
import publicRouter from "./public";
import linksRouter from "./links";
import setupRouter from "./setup";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(setupRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/public", publicRouter);
router.use("/links", linksRouter);
router.use("/admin", adminRouter);

export default router;
