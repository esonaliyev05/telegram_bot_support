require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);

if (!TOKEN) {
  throw new Error("❌ BOT_TOKEN topilmadi. .env faylni tekshir!");
}

const bot = new TelegramBot(TOKEN, { polling: true });

const userState = new Map();

/* ---------------- START ---------------- */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, "👋 Xush kelibsiz!", {
    reply_markup: {
      keyboard: [
        ["💬 Savol berish"],
        ["👨‍💻 Admin bilan gaplashish"],
        ["❓ FAQ"]
      ],
      resize_keyboard: true
    }
  });

  // Admin ga user kirgani haqida xabar
  bot.sendMessage(
    ADMIN_ID,
    `🆕 Yangi user start bosdi:\nID: ${chatId}\nUsername: @${msg.from.username || "yo'q"}`
  );
});

/* ---------------- MESSAGE HANDLER ---------------- */
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!text) return;

  /* FAQ */
  if (text === "❓ FAQ") {
    bot.sendMessage(chatId, "❓ Savolingizni yozing yoki admin bilan bog‘laning 👨‍💻");
    return;
  }

  /* User question mode */
  if (text === "💬 Savol berish" || text === "👨‍💻 Admin bilan gaplashish") {
    bot.sendMessage(chatId, "✍️ Savolingizni yozing...");
    userState.set(chatId, true);
    return;
  }

  /* USER → ADMIN */
  if (chatId !== ADMIN_ID && userState.get(chatId)) {
    bot.sendMessage(ADMIN_ID,
`📩 Yangi savol:
User ID: ${chatId}
Username: @${msg.from.username || "yo'q"}

💬 ${text}

👉 Reply qiling`
    );

    userState.set(chatId, false);
    return;
  }

  /* ADMIN → USER REPLY */
  if (chatId === ADMIN_ID && msg.reply_to_message) {
    const originalText = msg.reply_to_message.text;

    const match = originalText.match(/User ID: (\d+)/);

    if (match) {
      const userId = match[1];

      bot.sendMessage(userId, `👨‍💻 Admin javobi:\n${text}`);
    }
  }
});

/* ---------------- ERROR HANDLING ---------------- */
bot.on("polling_error", (err) => {
  console.log("❌ Polling error:", err.message);
});