import { Router } from "express";
import { ACTIVITY_CATALOG } from "../../data/catalog.js";

const router = Router();

router.get("/activities", (_req, res) => {
  res.json(ACTIVITY_CATALOG);
});

export default router;
