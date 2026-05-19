import { Router } from "express";
import sql from "../db.js";

const router = Router();

router.post("/", async (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled must be a boolean" });
  }

  await sql`
    UPDATE users SET earning_enabled = ${enabled}
    WHERE telegram_id = ${req.tgUser.id}
  `;

  res.json({ earning_enabled: enabled });
});

export default router;
