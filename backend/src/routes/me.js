import { Router } from "express";
import sql from "../db.js";

const router = Router();

router.get("/", async (req, res) => {
  const { id, username, first_name } = req.tgUser;

  await sql`
    INSERT INTO users (telegram_id, username, first_name)
    VALUES (${id}, ${username || null}, ${first_name || null})
    ON CONFLICT (telegram_id) DO UPDATE
      SET username = EXCLUDED.username,
          first_name = EXCLUDED.first_name,
          last_seen = now()
  `;

  const [user] = await sql`
    SELECT balance, total_earned, earning_enabled
    FROM users
    WHERE telegram_id = ${id}
  `;

  res.json(user);
});

export default router;
