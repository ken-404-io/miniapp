import { createHmac } from "crypto";

// Verifies Telegram initData HMAC signature.
// Rejects if hash is wrong or auth_date is older than 24 hours.
export function verifyInitData(initDataString) {
  if (!initDataString) return null;

  const params = new URLSearchParams(initDataString);
  const hash = params.get("hash");
  if (!hash) return null;

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  const secretKey = createHmac("sha256", "WebAppData")
    .update(process.env.BOT_TOKEN)
    .digest();

  const expectedHash = createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (expectedHash !== hash) return null;

  const authDate = parseInt(params.get("auth_date"), 10);
  if (!authDate || Date.now() / 1000 - authDate > 86400) return null;

  const userRaw = params.get("user");
  if (!userRaw) return null;

  try {
    return JSON.parse(userRaw);
  } catch {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const initData = req.headers["x-init-data"];
  const user = verifyInitData(initData);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  req.tgUser = user;
  next();
}
