import { Router } from "express";
import sql from "../db.js";
import { sendTelegramMessage } from "../notify.js";

const router = Router();

function requireAdminKey(req, res, next) {
  if (req.headers["x-admin-key"] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

router.use(requireAdminKey);

router.get("/withdrawals/pending", async (req, res) => {
  const rows = await sql`
    SELECT w.id, w.telegram_id, w.amount, w.channel, w.account_number,
           w.account_name, w.created_at,
           u.first_name, u.username
    FROM withdrawals w
    JOIN users u ON u.telegram_id = w.telegram_id
    WHERE w.status = 'pending'
    ORDER BY w.created_at ASC
  `;
  res.json(rows);
});

router.post("/withdrawals/:id/mark-paid", async (req, res) => {
  const { reference_number } = req.body;
  if (!reference_number) {
    return res.status(400).json({ error: "reference_number required" });
  }

  const [row] = await sql`
    UPDATE withdrawals
    SET status = 'paid', reference_number = ${reference_number}, processed_at = now()
    WHERE id = ${req.params.id} AND status = 'pending'
    RETURNING telegram_id, amount, channel, account_number
  `;

  if (!row) return res.status(404).json({ error: "Withdrawal not found or already processed" });

  await sendTelegramMessage(
    row.telegram_id,
    `✅ Your withdrawal of <b>₱${parseFloat(row.amount).toFixed(2)}</b> to ${row.channel} ${row.account_number} has been <b>paid</b>!\nReference: <code>${reference_number}</code>`
  );

  res.json({ ok: true });
});

router.post("/withdrawals/:id/reject", async (req, res) => {
  const { notes } = req.body;

  const [row] = await sql`
    UPDATE withdrawals
    SET status = 'rejected', notes = ${notes || null}, processed_at = now()
    WHERE id = ${req.params.id} AND status = 'pending'
    RETURNING telegram_id, amount
  `;

  if (!row) return res.status(404).json({ error: "Withdrawal not found or already processed" });

  // Refund balance
  await sql`
    UPDATE users SET balance = balance + ${row.amount}
    WHERE telegram_id = ${row.telegram_id}
  `;

  await sendTelegramMessage(
    row.telegram_id,
    `❌ Your withdrawal of <b>₱${parseFloat(row.amount).toFixed(2)}</b> was <b>rejected</b> and your balance has been refunded.${notes ? `\nReason: ${notes}` : ""}`
  );

  res.json({ ok: true });
});

router.post("/users/:tgId/ban", async (req, res) => {
  await sql`
    UPDATE users SET banned = true WHERE telegram_id = ${req.params.tgId}
  `;
  res.json({ ok: true });
});

export default router;
