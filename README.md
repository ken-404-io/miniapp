# Telegram Mini App — Watch Ads to Earn (PH)

Users earn PHP balance by watching Monetag rewarded ads inside Telegram. Withdrawals via GCash or Maya.

---

## Stack

| Layer | Service |
|---|---|
| Frontend | Plain HTML/JS — deployed on **Vercel** |
| Backend | Node.js + Express — deployed on **Railway** |
| Database | **Neon** (serverless Postgres) |
| Auth | Telegram `initData` HMAC-SHA256 |
| Payouts | Manual GCash / Maya |

---

## Deploy from Scratch

### 1. Neon (database)
1. Sign up at [neon.tech](https://neon.tech) and create a project.
2. Copy the connection string as `DATABASE_URL`.
3. Open the Neon SQL editor, paste and run `backend/db/schema.sql`.

### 2. BotFather (Telegram bot)
Follow `bot/setup.md`. You'll get a `BOT_TOKEN`.

### 3. Monetag (ad zone)
1. Sign up at [monetag.com](https://monetag.com).
2. Add your Mini App URL as a website.
3. Create a **Rewarded Interstitial** zone for TMA.
4. Copy the Zone ID.
5. In `frontend/index.html`, replace `<!-- MONETAG_SCRIPT_HERE -->` with the script tag Monetag gives you.
6. In `frontend/app.js`, replace `REPLACE_WITH_ZONE_ID` with the numeric zone ID.

### 4. Backend (Railway)
1. Push this repo to GitHub.
2. Create a new Railway project → Deploy from GitHub → set root to `backend/`.
3. Add all environment variables from `.env.example`.
4. Note the Railway HTTPS URL.
5. Update `API` constant in `frontend/app.js` to this URL.

### 5. Frontend (Vercel)
1. In Vercel, import the repo → set **Root Directory** to `frontend`.
2. No build command needed (static files).
3. Copy the Vercel URL.
4. Set `ALLOWED_ORIGIN` in Railway env to the Vercel URL.
5. Register the Vercel URL as the bot's menu button URL in BotFather (see `bot/setup.md`).

### 6. Test end-to-end
1. Open your bot in Telegram → tap menu button → Mini App opens.
2. Balance shows `₱0.00`, toggle ON.
3. Tap "Watch Ad to Earn" — Monetag plays rewarded ad.
4. After completion, balance increments by `REWARD_PER_AD_PHP`.
5. Reach `MIN_WITHDRAWAL_PHP` → submit a withdrawal.
6. Admin lists pending: `GET /admin/withdrawals/pending` with `X-Admin-Key`.
7. Admin sends from GCash/Maya, then calls `POST /admin/withdrawals/:id/mark-paid`.
8. User receives Telegram bot notification.

---

## Environment Variables

Copy `.env.example` to `backend/.env` and fill in all values.

| Variable | Description |
|---|---|
| `BOT_TOKEN` | From BotFather |
| `DATABASE_URL` | Neon Postgres connection string |
| `MONETAG_ZONE_ID` | Numeric zone ID from Monetag dashboard |
| `REWARD_PER_AD_PHP` | PHP credited per completed ad (e.g. `0.05`) |
| `MIN_WITHDRAWAL_PHP` | Minimum cashout in PHP (e.g. `50.00`) |
| `DAILY_AD_LIMIT` | Max ad credits per user per UTC day |
| `MIN_AD_INTERVAL_SECONDS` | Minimum seconds between ad credits |
| `ADMIN_KEY` | Long random string for admin API auth |
| `ADMIN_TELEGRAM_ID` | Your Telegram user ID for notifications |
| `ALLOWED_ORIGIN` | Your Vercel frontend URL (CORS) |

---

## API Reference

All authenticated endpoints require `X-Init-Data: <telegram initData>` header.

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | None | Health check |
| GET | `/api/me` | User | Balance + toggle state. Auto-creates user. |
| POST | `/api/reward` | User | Credit one ad view (anti-fraud enforced). |
| POST | `/api/toggle-earning` | User | `{ enabled: boolean }` |
| POST | `/api/withdraw` | User | Submit withdrawal. Deducts balance immediately. |
| GET | `/api/withdrawals` | User | Own withdrawal history. |
| GET | `/admin/withdrawals/pending` | Admin key | List pending with full payout details. |
| POST | `/admin/withdrawals/:id/mark-paid` | Admin key | `{ reference_number }` — notifies user. |
| POST | `/admin/withdrawals/:id/reject` | Admin key | `{ notes }` — refunds balance, notifies user. |
| POST | `/admin/users/:tgId/ban` | Admin key | Ban a user. |

Admin endpoints require `X-Admin-Key: <ADMIN_KEY>` header.

---

## Anti-fraud Rules

- Banned users are rejected.
- Earning disabled → rejected.
- Cooldown: must wait `MIN_AD_INTERVAL_SECONDS` between credits.
- Daily cap: max `DAILY_AD_LIMIT` ad credits per UTC day.
- Balance updates use the `increment_balance` SQL function (atomic).

---

## Local Development

```bash
cd backend
npm install
cp ../.env.example .env   # fill in values
npm run dev               # starts on PORT (default 3000)
```

Test the health endpoint:
```bash
curl http://localhost:3000/health
# {"ok":true}
```

The frontend can be served with any static file server:
```bash
cd frontend
npx serve .
```

Note: `initData` verification requires a real Telegram session. For local testing of the backend, use [Telegram's test mode](https://core.telegram.org/bots/webapps#testing-mini-apps).
