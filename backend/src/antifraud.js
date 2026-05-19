import sql from "./db.js";

export async function checkRewardEligibility(telegramId) {
  const intervalSec = parseInt(process.env.MIN_AD_INTERVAL_SECONDS || "30", 10);
  const dailyLimit = parseInt(process.env.DAILY_AD_LIMIT || "50", 10);

  const [user] = await sql`
    SELECT banned, earning_enabled FROM users WHERE telegram_id = ${telegramId}
  `;

  if (!user) return { allowed: false, reason: "User not found" };
  if (user.banned) return { allowed: false, reason: "Account banned" };
  if (!user.earning_enabled) return { allowed: false, reason: "Earning disabled" };

  const [recentRow] = await sql`
    SELECT COUNT(*) AS cnt FROM ad_views
    WHERE telegram_id = ${telegramId}
      AND created_at > now() - (${intervalSec} || ' seconds')::interval
  `;
  if (parseInt(recentRow.cnt, 10) > 0) {
    return { allowed: false, reason: `Must wait ${intervalSec}s between ads` };
  }

  const [dailyRow] = await sql`
    SELECT COUNT(*) AS cnt FROM ad_views
    WHERE telegram_id = ${telegramId}
      AND created_at >= date_trunc('day', now() AT TIME ZONE 'UTC')
  `;
  if (parseInt(dailyRow.cnt, 10) >= dailyLimit) {
    return { allowed: false, reason: "Daily ad limit reached" };
  }

  return { allowed: true };
}
