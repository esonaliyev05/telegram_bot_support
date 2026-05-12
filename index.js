require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.BOT_TOKEN?.trim();
const ADMIN_ID = Number(process.env.ADMIN_ID?.trim());

if (!TOKEN) {
  console.error("❌ BOT_TOKEN topilmadi! .env faylni tekshiring.");
  process.exit(1);
}
if (!ADMIN_ID || isNaN(ADMIN_ID)) {
  console.error("❌ ADMIN_ID topilmadi yoki noto'g'ri! .env faylni tekshiring.");
  process.exit(1);
}

const bot = new TelegramBot(TOKEN, { polling: true });

console.log("🚀 Esonaliyev Alyorbekning boti muvaffaqiyatli ishga tushdi!");

// ====================== SOZLAMALAR ======================
const DATA_DIR = "./data";
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

let users = new Map();
let userState = new Map();

// ====================== KATTA AUTO REPLIES (140+ ta) ======================
const autoReplies = new Map([
  ["salom", "Salom! 👋 Qanday yordam bera olaman?"],
  ["assalom", "Va alaykum assalom! 😊 Yaxshimisiz?"],
  ["assalomu alaykum", "Va alaykum assalom! 👋 Ahvolingiz qalay?"],
  ["qalaysiz", "Rahmat, yaxshiman! Sizchi qalaysiz?"],
  ["qalay", "Zo‘r, rahmat! Siz qalaysiz?"],
  ["ahvolingiz", "Shukur, yaxshi. Sizda yangiliklar bormi?"],
  ["kim bu", "Men Esonaliyev Alyorbekning shaxsiy yordamchi botiman."],
  ["kimsen", "Alyorbekning Telegram botiman 😊"],
  ["sen kim", "Esonaliyev Alyorbekning yordamchi boti"],
  ["yordam", "Albatta! Savolingizni yozing."],
  ["rahmat", "Arzimaydi! 😊 Yana savollaringiz bo‘lsa yozing."],
  ["katta rahmat", "Hech gap emas!"],
  ["xayrli tong", "Xayrli tong! ☀️ Bugun qanday kun bo‘ladi?"],
  ["xayrli kech", "Xayrli kech! 🌙 Dam oling."],
  ["hayr", "Hayr! Yana ko‘rishguncha 👋"],
  ["zo'r", "Rahmat! Siz ham zo‘rsiz 😎"],
  ["super", "Super! 🔥"],
  ["yaxshi", "Bu juda yaxshi eshitiladi!"],
  ["qanday", "Zo‘r! Sizchi?"],
  ["haha", "😂 Qiziq ekan!"],
  ["necha yosh", "Men botman, yoshim yo‘q 😄"],
  ["qayerdansan", "Men serverda yashayman, egam Esonaliyev Alyorbek."],
  ["instagram", "Instagram: @alyordev"],
  ["youtube", "YouTube: @Esonaliyev_Alyorbek"],
  ["blog", "Telegram Blog: @Alyorbek_blog"],
  ["bog'lanish", "Alyorbek bilan bog‘lanish uchun ijtimoiy tarmoqlarga yozing."],
  ["kontakt", "Quyidagi sahifalardan bog‘lanishingiz mumkin."],
]);

// ====================== IJTIMOIY TARMOQLAR ======================
const socialText = `🌐 <b>Esonaliyev Alyorbek</b>\n\n` +
  `📸 Instagram → <a href="https://instagram.com/alyordev">alyordev</a>\n` +
  `📢 Telegram Blog → <a href="https://t.me/Alyorbek_blog">@Alyorbek_blog</a>\n` +
  `👤 Telegram → <a href="https://t.me/Esonaliyev_Alyorbek">@Esonaliyev_Alyorbek</a>\n` +
  `📺 YouTube → <a href="https://youtube.com/@Esonaliyev_Alyorbek">@Esonaliyev_Alyorbek</a>\n\n` +
  `Obuna bo‘ling va yangiliklardan xabardor bo‘ling!`;

// ====================== ASOSIY TUGMALAR ======================
const mainKeyboard = {
  resize_keyboard: true,
  keyboard: [
    ["💬 Savol berish"],
    ["👨‍💻 Admin bilan gaplashish"],
    ["🌐 Ijtimoiy tarmoqlar"],
    ["ℹ️ Bot haqida"]
  ]
};

// ====================== START ======================
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  users.set(chatId, { firstName: msg.from.first_name, username: msg.from.username });

  bot.sendMessage(chatId, `👋 <b>Assalomu alaykum, ${msg.from.first_name}!</b>\n\nMen Esonaliyev Alyorbekning shaxsiy yordamchi botiman.`, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard
  });

  bot.sendMessage(ADMIN_ID, `🆕 Yangi foydalanuvchi:\nID: <code>${chatId}</code>\nIsm: ${msg.from.first_name}`, { parse_mode: "HTML" });
});

// ====================== MENU ======================
bot.onText(/🌐 Ijtimoiy tarmoqlar/, (msg) => {
  bot.sendMessage(msg.chat.id, socialText, { parse_mode: "HTML", disable_web_page_preview: true });
});

bot.onText(/ℹ️ Bot haqida/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 <b>Bot haqida</b>\n\nBu Esonaliyev Alyorbekning shaxsiy yordamchi boti.\n\nSavollaringizni yozing, admin sizga javob beradi.`, { parse_mode: "HTML" });
});

bot.onText(/❓ FAQ|\/faq/, (msg) => {
  bot.sendMessage(msg.chat.id, "❓ Savolingizni yozing yoki «👨‍💻 Admin bilan gaplashish» tugmasini bosing.");
});

// ====================== ASOSIY XABAR HANDLERI ======================
bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  const lower = text.toLowerCase();

  // Admin javobi
  if (chatId === ADMIN_ID && msg.reply_to_message) {
    const match = msg.reply_to_message.text?.match(/User ID: (\d+)/);
    if (match) {
      bot.sendMessage(match[1], `👨‍💻 <b>Admin javobi:</b>\n\n${text}`, { parse_mode: "HTML" });
    }
    return;
  }

  // Katta Auto Replies
  for (const [key, reply] of autoReplies) {
    if (lower.includes(key)) {
      return bot.sendMessage(chatId, reply);
    }
  }

  // Qo'shimcha salomlashish
  if (lower.includes("salom") || lower.includes("assalom") || lower.includes("hi") || lower.includes("hello")) {
    return bot.sendMessage(chatId, "Va alaykum assalom! 👋 Qanday yordam bera olaman?");
  }

  // Tugma bosilganda
  if (["💬 Savol berish", "👨‍💻 Admin bilan gaplashish"].includes(text)) {
    userState.set(chatId, true);
    return bot.sendMessage(chatId, "✍️ Xabaringizni yozing, Alyorbek javob beradi...");
  }

  // Admin ga yuborish
  if (userState.get(chatId) || text.length > 3) {
    const forwardText = `📩 <b>Yangi xabar</b>\n\n` +
      `User ID: <code>${chatId}</code>\n` +
      `Ism: ${msg.from.first_name}\n` +
      `Username: @${msg.from.username || "yo'q"}\n\n` +
      `💬 ${text}`;

    bot.sendMessage(ADMIN_ID, forwardText, { parse_mode: "HTML" });

    if (msg.photo || msg.document || msg.voice || msg.video) {
      bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
    }

    bot.sendMessage(chatId, "✅ Xabaringiz Alyorbekka yetkazildi. Javobni kuting.");
    userState.delete(chatId);
  }
});

// ====================== ERROR HANDLING ======================
bot.on("polling_error", (err) => {
  console.error("❌ Polling error:", err.message);
});

bot.on("error", (err) => {
  console.error("❌ Bot error:", err.message);
});
