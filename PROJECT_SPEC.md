# Project Spec: Telegram Mini App — Watch Ads to Earn (Monetag, PH market)

> Hand this file to Claude Code as your project brief. Place it as `PROJECT_SPEC.md` (or `CLAUDE.md`) in your project root.

---

## 1. Project Overview

Build a **Telegram Mini App** for the Philippine market where users earn an in-app PHP balance by watching rewarded ads served via the **Monetag SDK for TMA**. Users can toggle "earning enabled" on/off. The backend tracks each ad view, credits the user's balance, enforces anti-fraud rules, and handles withdrawal requests paid out manually via **GCash or Maya**.

**This is NOT a regular website with paid-to-click.** That violates Monetag's terms and will get the account banned. Rewarded ads inside a Telegram Mini App is the only Monetag-compliant earning model.

### Core flow
1. User opens the bot in Telegram → taps menu button → Mini App opens.
2. Mini App authenticates user using Telegram's signed `initData`.
3. User toggles earning ON, taps "Watch Ad to Earn."
4. Monetag SDK shows a Rewarded Interstitial.
5. On ad completion, frontend calls backend `/api/reward`.
6. Backend verifies `initData`, applies anti-fraud checks, credits balance in PHP.
7. When balance ≥ `MIN_WITHDRAWAL_PHP`, user submits a withdrawal request: amount, GCash/Maya, mobile number, full name.
8. Admin manually sends from their GCash/Maya app, copies the reference number, marks the withdrawal as paid. Bot notifies the user.

---

## 2. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Plain HTML + vanilla JS | Mini App is one page; no framework needed |
| Backend | Node.js + Express | Mainstream, easy to debug, well-documented |
| Database | **Neon** (serverless Postgres) | Free tier, autoscaling, built-in branching for safe migrations |
| DB driver | `@neondatabase/serverless` | Works everywhere, no connection pool config |
| Frontend hosting | **Vercel** | Free, HTTPS by default, fast deploys |
| Backend hosting | **Railway** | Easy Git deploy, $5/mo for always-on |
| Auth | Telegram `initData` HMAC verification | Built-in; no separate auth system |
| Payouts | Manual GCash / Maya (v1) | PH-native, no API barrier for individuals |

---

## 3. Folder Structure

```
/
├── PROJECT_SPEC.md
├── README.md
├── .env.example
├── frontend/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js
│   │   ├── auth.js
│   │   ├── db.js
│   │   ├── antifraud.js
│   │   ├── notify.js
│   │   └── routes/
│   │       ├── me.js
│   │       ├── reward.js
│   │       ├── toggle.js
│   │       ├── withdraw.js
│   │       └── admin.js
│   └── db/
│       ├── schema.sql
│       └── migrations/
└── bot/
    └── setup.md
```
