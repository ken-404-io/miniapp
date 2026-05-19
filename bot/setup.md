# Bot Setup via BotFather

## 1. Create the bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot`.
3. Enter a display name (e.g. `PH Earn Bot`).
4. Enter a username (must end in `bot`, e.g. `ph_earn_bot`).
5. BotFather gives you a `BOT_TOKEN` — copy it to `backend/.env`.

## 2. Get your Telegram user ID
- Talk to `@userinfobot` or `@getidsbot`.
- Copy your numeric ID to `ADMIN_TELEGRAM_ID` in `backend/.env`.

## 3. Set the Mini App menu button
```
/mybots → select your bot → Bot Settings → Menu Button → Configure Menu Button
```
Set URL to your Vercel frontend URL, e.g. `https://your-mini-app.vercel.app`

Or via BotFather commands:
```
/setmenubutton
@your_bot_username
https://your-mini-app.vercel.app
```

## 4. Set bot description and about text (optional)
```
/setdescription
/setabouttext
```

## 5. Enable inline mode (optional, skip for v1)
```
/setinline
```

## 6. Verify
Send `/start` to your bot in Telegram — the menu button should appear and open the Mini App.
