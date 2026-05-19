import { Router } from "express";
import sql from "../db.js";

const router = Router();

const ACCOUNT_NUMBER_RE = /^09\d{9}$/;
const ACCOUNT_NAME_RE = /^[a-zA-Z\s'\-]{2,60}$/;

// POST /api/withdraw
router.post("/withdraw", async (req, res) => {
  const telegramId = req.tgUser.id;
  const minWithdrawal = parseFloat(process.env.MIN_WITHDRAWAL_PHP || "50");

  const { amount, channel, account_number, account_name } = req.body;

  if (!amount || isNaN(amount) || parseFloat(amount) < minWithdrawal) {
    return res.status(400).json({ error: `Minimum withdrawal is ₱${minWithdrawal}` });
  }
  if (!["GCASH", "MAYA"].includes(channel)) {
    return res.status(400).json({ error: "channel must be GCASH or MAYA" });
  }
  if (!ACCOUNT_NUMBER_RE.test(account_number)) {
    return res.status(400).json({ error: "Invalid mobile number (must be 09XXXXXXXXX)" });
  }
  if (!ACCOUNT_NAME_RE.test(account_name)) {
    return res.status(400).json({ error: "Invalid account name" });
  }

  const amt = parseFloat(parseFloat(amount).toFixed(2));

  const [user] = await sql`
    SELECT balance, banned FROM users WHERE telegram_id = ${telegramId}
  `;

  if (!user || user.banned) {
    return res.status(403).json({ error: "Account banned or not found" });
  }
  if (parseFloat(user.balance) < amt) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  // Deduct balance and create withdrawal atomically
  const result = await sql`
    WITH deducted AS (
      UPDATE users
      SET balance = balance - ${amt}
      WHERE telegram_id = ${telegramId} AND balance >= ${amt}
      RETURNING telegram_id
    )
    INSERT INTO withdrawals (telegram_id, amount, channel, account_number, account_name)
    SELECT ${telegramId}, ${amt}, ${channel}, ${account_number}, ${account_name}
    FROM deducted
    RETURNING id
  `;

  if (result.length === 0) {
    return res.status(400).json({ error: "Insufficient balance" });
  }

  res.json({ id: result[0].id, status: "pending" });
});

// GET /api/withdrawals
router.get("/withdrawals", async (req, res) => {
  const rows = await sql`
    SELECT id, amount, channel, account_number, account_name, status,
           reference_number, notes, created_at, processed_at
    FROM withdrawals
    WHERE telegram_id = ${req.tgUser.id}
    ORDER BY created_at DESC
    LIMIT 50
  `;
  res.json(rows);
});

export default router;
