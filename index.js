require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");
 
const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);

if (!TOKEN) throw new Error("❌ BOT_TOKEN topilmadi. .env faylni tekshir!");
if (!ADMIN_ID) throw new Error("❌ ADMIN_ID topilmadi. .env faylni tekshir!");

const bot = new TelegramBot(TOKEN, { polling: true });

// ====================== SOZLAMALAR ======================
const DATA_DIR = "./data";
const USERS_FILE = path.join(DATA_DIR, "users.json");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");
const BANNED_FILE = path.join(DATA_DIR, "banned.json");

let users = new Map();
let groups = new Map();
let bannedUsers = new Set();
let userState = new Map();

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const loadData = () => {
  if (fs.existsSync(USERS_FILE)) users = new Map(JSON.parse(fs.readFileSync(USERS_FILE)));
  if (fs.existsSync(GROUPS_FILE)) groups = new Map(JSON.parse(fs.readFileSync(GROUPS_FILE)));
  if (fs.existsSync(BANNED_FILE)) bannedUsers = new Set(JSON.parse(fs.readFileSync(BANNED_FILE)));
};

const saveData = () => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(users), null, 2));
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(Array.from(groups), null, 2));
  fs.writeFileSync(BANNED_FILE, JSON.stringify(Array.from(bannedUsers), null, 2));
};

// ====================== JUDA KATTA AUTO REPLIES (140+ ta) ======================
const autoReplies = new Map([
  // Salomlashish
  ["salom", "Salom! 👋 Qanday yordam bera olaman?"],
  ["assalom", "Va alaykum assalom! 😊 Yaxshimisiz?"],
  ["assalomu alaykum", "Va alaykum assalom! 👋 Ahvolingiz qalay?"],
  ["salom alekum", "Va alaykum assalom!"],
  ["hi", "Salom! 👋"],
  ["hello", "Hello! How can I help you?"],

  // Ahvol so'rash
  ["qalaysiz", "Rahmat, yaxshiman! Sizchi qalaysiz?"],
  ["qalay", "Zo‘r, rahmat! Siz qalaysiz?"],
  ["qandaysiz", "Yaxshiman, rahmat. Siz-chi?"],
  ["ahvolingiz", "Shukur, yaxshi. Sizda yangiliklar bormi?"],
  ["ahvol", "Yaxshi, rahmat!"],

  // Bot haqida
  ["kim bu", "Men Esonaliyev Alyorbekning shaxsiy yordamchi botiman."],
  ["kimsen", "Alyorbekning Telegram botiman 😊"],
  ["sen kim", "Esonaliyev Alyorbekning yordamchi boti"],
  ["bot", "Ha, men Alyorbekning aqlli yordamchi botiman."],

  // Bog'lanish
  ["bog'lanish", "Alyorbek bilan bog‘lanish uchun ijtimoiy tarmoqlarga yozing yoki admin tugmasini bosing."],
  ["men bilan bog'lan", "Alyorbek bilan gaplashmoqchimisiz? Quyidagi sahifalarga yozing:"],
  ["kontakt", "Alyorbek bilan bog‘lanish uchun ijtimoiy tarmoqlardan foydalaning."],
  ["telefon", "Telefon raqami orqali bog‘lanish uchun admin bilan yozing."],

  // Ijtimoiy tarmoqlar
  ["instagram", "Instagram: @alyordev"],
  ["youtube", "YouTube: @Esonaliyev_Alyorbek"],
  ["telegram", "Telegram: @Esonaliyev_Alyorbek"],
  ["blog", "Telegram Blog: @Alyorbek_blog"],

  // Yordam va rahmat
  ["yordam", "Albatta! Savolingizni yozing, yordam beraman."],
  ["rahmat", "Arzimaydi! 😊 Yana savollaringiz bo‘lsa yozing."],
  ["katta rahmat", "Hech gap emas, xizmatga tayyorman!"],
  ["raxmat", "Arzimaydi!"],

  // Vaqt
  ["xayrli tong", "Xayrli tong! ☀️ Bugun qanday kun bo‘ladi?"],
  ["xayrli kun", "Xayrli kun! 😊"],
  ["xayrli kech", "Xayrli kech! 🌙 Dam oling."],
  ["tun yaxshi", "Yaxshi tun! 🌙"],
  ["hayr", "Hayr! Yana ko‘rishguncha 👋"],

  // Ijobiy javoblar
  ["zo'r", "Rahmat! Siz ham zo‘rsiz 😎"],
  ["super", "Super! 🔥"],
  ["yaxshi", "Bu juda yaxshi eshitiladi!"],
  ["ajoyib", "Rahmat! 😊"],
  ["qanday", "Zo‘r! Sizchi?"],

  // Kulgi va hazil
  ["haha", "😂 Qiziq ekan!"],
  ["kulgi", "😄"],
  ["😂", "😂"],

  // Shaxsiy savollar
  ["necha yosh", "Men botman, yoshim yo‘q 😄"],
  ["qayerdansan", "Men serverda yashayman, egam Esonaliyev Alyorbek."],
  ["ishlayapsizmi", "Men 24/7 ishlayman. Siz nima bilan bandisiz?"],
  ["o'qiysizmi", "Men o‘qimayman, lekin sizga yordam beraman 📚"],
  ["oilangiz", "Men botman, oilam yo‘q 😄"],

  // Qo'shimcha ko'p savollar
  ["bor", "Ha, bor! Nima kerak?"],
  ["yo'q", "Tushundim. Boshqa savol bo‘lsa yozing."],
  ["ha", "Yaxshi, davom eting 😊"],
  ["charchadim", "Dam oling, keyinroq yozing."],
  ["uyqum kelyapti", "Yaxshi uxlang! Ertaga yozing."],
  ["qiziq", "Qiziqarli! Batafsilroq aytib bering."],
  ["kechirasiz", "Hech narsa yo‘q, ayting."],
  ["hozir band", "Tushundim, qachon bo‘sh bo‘lsangiz yozing."],
  ["ok", "Yaxshi 👍"],
  ["tushundim", "Tushundim 😊"],
  ["spasibo", "Arzimaydi!"],
  ["thank you", "You're welcome!"],
  ["good", "Good! 😊"],
  ["nice", "Thank you!"],
  ["bye", "Bye! 👋"],
  ["good night", "Good night! 🌙"],
  ["good morning", "Good morning! ☀️"],
]);

// ====================== IJTIMOIY TARMOQLAR ======================
const socialText = `🌐 <b>Esonaliyev Alyorbek</b>\n\n` +
  `📸 Instagram: <a href="https://instagram.com/alyordev">alyordev</a>\n` +
  `📢 Telegram Blog: <a href="https://t.me/Alyorbek_blog">@Alyorbek_blog</a>\n` +
  `👤 Telegram: <a href="https://t.me/Esonaliyev_Alyorbek">@Esonaliyev_Alyorbek</a>\n` +
  `📺 YouTube: <a href="https://youtube.com/@Esonaliyev_Alyorbek">@Esonaliyev_Alyorbek</a>\n\n` +
  `Obuna bo‘ling va yangiliklardan xabardor bo‘ling!`;

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
  const isGroup = msg.chat.type !== "private";

  if (isGroup) {
    groups.set(chatId, { title: msg.chat.title || "Guruh", addedAt: Date.now() });
    saveData();
    return bot.sendMessage(chatId, "✅ Bot guruhga qo‘shildi!");
  }

  users.set(chatId, { firstName: msg.from.first_name, username: msg.from.username, lastActive: Date.now() });
  saveData();

  bot.sendMessage(chatId, `👋 <b>Assalomu alaykum, ${msg.from.first_name}!</b>\n\nMen Esonaliyev Alyorbekning shaxsiy yordamchi botiman.`, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard
  });

  bot.sendMessage(ADMIN_ID, `🆕 Yangi user:\nID: <code>${chatId}</code>\nIsm: ${msg.from.first_name}`, { parse_mode: "HTML" });
});

// ====================== MENU ======================
bot.onText(/🌐 Ijtimoiy tarmoqlar/, (msg) => {
  bot.sendMessage(msg.chat.id, socialText, { parse_mode: "HTML", disable_web_page_preview: true });
});

bot.onText(/ℹ️ Bot haqida/, (msg) => {
  bot.sendMessage(msg.chat.id, `🤖 <b>Bot haqida</b>\n\nBu Esonaliyev Alyorbekning shaxsiy yordamchi boti.\nSavollaringizni yozing, admin javob beradi.`, { parse_mode: "HTML" });
});

bot.onText(/❓ FAQ|\/faq/, (msg) => {
  bot.sendMessage(msg.chat.id, "❓ Savolingizni yozing yoki «👨‍💻 Admin bilan gaplashish» tugmasini bosing.");
});

// ====================== ASOSIY HANDLER ======================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  if (chatId === ADMIN_ID && msg.reply_to_message) {
    const match = msg.reply_to_message.text?.match(/User ID: (\d+)/);
    if (match) bot.sendMessage(match[1], `👨‍💻 <b>Admin javobi:</b>\n\n${text}`, { parse_mode: "HTML" });
    return;
  }

  const lower = text.toLowerCase();

  // Kengaytirilgan Auto Replies
  for (const [key, reply] of autoReplies) {
    if (lower.includes(key)) {
      return bot.sendMessage(chatId, reply);
    }
  }

  // Qo'shimcha salomlashish
  if (lower.includes("assalom") || lower.includes("salom") || lower.includes("hello") || lower.includes("hi")) {
    return bot.sendMessage(chatId, "Va alaykum assalom! 👋 Qanday yordam bera olaman?");
  }

  // Tugmalar
  if (["💬 Savol berish", "👨‍💻 Admin bilan gaplashish"].includes(text)) {
    userState.set(chatId, true);
    return bot.sendMessage(chatId, "✍️ Xabaringizni yozing, Alyorbek javob beradi...");
  }

  // Admin ga yuborish
  if (userState.get(chatId) || text.length > 3) {
    const forwardText = `📩 <b>Yangi xabar</b>\n\nUser ID: <code>${chatId}</code>\nIsm: ${msg.from.first_name}\nUsername: @${msg.from.username || "yo'q"}\n\n💬 ${text}`;
    
    bot.sendMessage(ADMIN_ID, forwardText, { parse_mode: "HTML" });

    if (msg.photo || msg.document || msg.voice || msg.video) {
      bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
    }

    bot.sendMessage(chatId, "✅ Xabaringiz Alyorbekka yetkazildi. Javobni kuting.");
    userState.delete(chatId);
  }
});

bot.on("polling_error", (err) => console.error("Polling error:", err.message));

console.log("🚀 Esonaliyev Alyorbekning boti ishga tushdi! (Katta AutoReplies bilan)");
