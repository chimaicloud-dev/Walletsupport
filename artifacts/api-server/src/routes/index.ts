import { Router, type IRouter } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import conversationsRouter from "./conversations";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/users", usersRouter);
router.use("/conversations", conversationsRouter);
router.use("/public", publicRouter);

export default router;
