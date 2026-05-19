export async function sendTelegramMessage(chatId, text) {
  const token = process.env.BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error("Telegram sendMessage failed:", await res.text());
    }
  } catch (err) {
    console.error("Telegram sendMessage error:", err.message);
  }
}
