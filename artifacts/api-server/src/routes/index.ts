import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import itinerariesRouter from "./itineraries/index.js";
import activitiesRouter from "./activities/index.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(itinerariesRouter);
router.use(activitiesRouter);

export default router;
