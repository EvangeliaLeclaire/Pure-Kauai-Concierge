import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import itinerariesRouter from "./itineraries/index.js";
import activitiesRouter from "./activities/index.js";
import authRouter from "./auth/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(itinerariesRouter);
router.use(activitiesRouter);
router.use(authRouter);

export default router;
