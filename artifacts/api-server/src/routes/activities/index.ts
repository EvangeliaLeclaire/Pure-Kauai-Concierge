import { Router } from "express";
import { SERVICE_CATALOG } from "../../data/catalog.js";

const router = Router();

router.get("/activities", (_req, res) => {
  res.json(SERVICE_CATALOG);
});

export default router;
