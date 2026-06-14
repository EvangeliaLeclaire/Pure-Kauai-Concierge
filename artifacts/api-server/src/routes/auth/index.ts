import { Router } from "express";

const router = Router();

router.post("/auth/verify", (req, res) => {
  const { password } = req.body as { password?: string };
  const expected = process.env.CONCIERGE_PASSWORD;

  if (!expected) {
    res.status(500).json({ error: "Server not configured — CONCIERGE_PASSWORD is not set." });
    return;
  }

  if (!password || password !== expected) {
    res.status(401).json({ error: "Invalid password." });
    return;
  }

  res.json({ ok: true });
});

export default router;
