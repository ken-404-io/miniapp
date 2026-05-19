import { Router } from "express";
import sql from "../db.js";
import { checkRewardEligibility } from "../antifraud.js";

const router = Router();

router.post("/", async (req, res) => {
  const telegramId = req.tgUser.id;
  const rewardAmt = parseFloat(process.env.REWARD_PER_AD_PHP || "0.05");

  const check = await checkRewardEligibility(telegramId);
  if (!check.allowed) {
    return res.status(403).json({ error: check.reason });
  }

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || null;

  await sql`
    INSERT INTO ad_views (telegram_id, reward, ip, user_agent)
    VALUES (${telegramId}, ${rewardAmt}, ${ip}, ${userAgent})
  `;

  await sql`SELECT increment_balance(${telegramId}, ${rewardAmt})`;

  const [user] = await sql`
    SELECT balance FROM users WHERE telegram_id = ${telegramId}
  `;

  res.json({ credited: rewardAmt, balance: user.balance });
});

export default router;
