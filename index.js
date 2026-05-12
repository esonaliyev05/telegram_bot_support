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

// Ma'lumotlarni yuklash
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

// ====================== KATTA AUTO REPLIES (Ijtimoiy tarmoqlar + Bog'lanish) ======================
const autoReplies = new Map([
  // Salomlashish va ahvol
  ["salom", "Salom! 👋 Qanday yordam bera olaman?"],
  ["assalom", "Va alaykum assalom! 😊 Yaxshimisiz?"],
  ["assalomu alaykum", "Va alaykum assalom! 👋 Ahvolingiz qalay?"],
  ["qalaysiz", "Rahmat, yaxshiman! Sizchi?"],
  ["qalay", "Zo‘r, rahmat! Siz qalaysiz?"],

  // Bot va men haqida
  ["kim bu", "Men Esonaliyev Alyorbekning shaxsiy yordamchi botiman."],
  ["kimsen", "Alyorbekning Telegram botiman 😊"],
  ["sen kim", "Esonaliyev Alyorbekning yordamchi boti"],

  // Men bilan bog'lanish
  ["bog'lanish", "Esonaliyev Alyorbek bilan bog‘lanish uchun admin tugmasini bosing yoki ijtimoiy tarmoqlarga o‘ting."],
  ["men bilan bog'lan", "Alyorbek bilan bog‘lanmoqchimisiz? Quyidagi ijtimoiy tarmoqlarga yozing:"],
  ["alyor", "Alyorbek bilan gaplashmoqchimisiz? Admin tugmasini bosing yoki ijtimoiy sahifalarga o‘ting."],
  ["kontakt", "Alyorbek bilan bog‘lanish uchun quyidagilardan foydalaning:"],
  ["telefon", "Telefon raqam orqali bog‘lanish uchun admin bilan yozishingiz mumkin."],
  ["instagram", "Instagram: @yourinstagram"],
  ["youtube", "YouTube: @youryoutube"],
  ["telegram kanal", "Telegram Kanal: @yourchannel"],

  // Ijtimoiy tarmoqlar haqida savollar
  ["ijtimoiy", "Esonaliyev Alyorbekning ijtimoiy tarmoqlari:"],
  ["sahifa", "Quyidagi sahifalarga obuna bo‘ling:"],
  ["instagramda", "Instagram: @yourinstagram"],
  ["tg kanal", "Telegram Kanal: @yourchannel"],
  ["youtube kanal", "YouTube: @youryoutube"],

  // Yordam va rahmat
  ["yordam", "Albatta! Savolingizni yozing yoki Alyorbek bilan bog‘laning."],
  ["rahmat", "Arzimaydi! 😊 Yana savollaringiz bo‘lsa yozing."],
  ["katta rahmat", "Hech gap emas!"],

  // Vaqt va boshqa
  ["xayrli tong", "Xayrli tong! ☀️"],
  ["xayrli kech", "Xayrli kech! 🌙"],
  ["hayr", "Hayr! Yana ko‘rishguncha 👋"],
  ["zo'r", "Rahmat! Siz ham zo‘rsiz 😎"],
  ["super", "Super! 🔥"],

  // Qo'shimcha
  ["nima qilasiz", "Foydalanuvchilarga yordam beraman va Alyorbek bilan bog‘layman."],
  ["necha yosh", "Men botman, yoshim yo‘q 😄"],
  ["qayerdansan", "Men serverda yashayman, egam Esonaliyev Alyorbek."],
  ["haha", "😂 Qiziq ekan!"],
  ["charchadim", "Dam oling, keyin yozing."],
]);

// ====================== IJTIMOIY TARMOQLAR MENU ======================
const socialText = `🌐 <b>Esonaliyev Alyorbekning ijtimoiy tarmoqlari</b>\n\n` +
  `📸 Instagram: @yourinstagram\n` +
  `📺 YouTube: @youryoutube\n` +
  `📢 Telegram Kanal: @yourchannel\n` +
  `💬 Telegram: @yourusername\n\n` +
  `Obuna bo‘ling va yangiliklardan xabardor bo‘ling!`;

const mainKeyboard = {
  resize_keyboard: true,
  keyboard: [
    ["💬 Savol berish"],
    ["👨‍💻 Admin bilan gaplashish"],
    ["🌐 Ijtimoiy tarmoqlar"],
    ["❓ FAQ"]
  ]
};

// ====================== START ======================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type !== "private";

  if (isGroup) {
    groups.set(chatId, { title: msg.chat.title || "Guruh", addedAt: Date.now() });
    saveData();
    return bot.sendMessage(chatId, "✅ Bot guruhga qo‘shildi!");
  }

  users.set(chatId, {
    firstName: msg.from.first_name,
    username: msg.from.username,
    lastActive: Date.now()
  });
  saveData();

  bot.sendMessage(chatId, `👋 <b>Assalomu alaykum, ${msg.from.first_name}!</b>\n\nMen Esonaliyev Alyorbekning shaxsiy yordamchi botiman.`, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard
  });

  bot.sendMessage(ADMIN_ID, `🆕 Yangi user: <code>${chatId}</code> - ${msg.from.first_name}`, { parse_mode: "HTML" });
});

// ====================== MENU HANDLER ======================
bot.onText(/🌐 Ijtimoiy tarmoqlar/, (msg) => {
  bot.sendMessage(msg.chat.id, socialText, { parse_mode: "HTML" });
});

bot.onText(/❓ FAQ|\/faq/, (msg) => {
  bot.sendMessage(msg.chat.id, "❓ Savolingizni yozing yoki «👨‍💻 Admin bilan gaplashish» tugmasini bosing.");
});

// ====================== ASOSIY MESSAGE HANDLER ======================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  // Admin javobi
  if (chatId === ADMIN_ID && msg.reply_to_message) {
    const match = msg.reply_to_message.text?.match(/User ID: (\d+)/);
    if (match) {
      bot.sendMessage(match[1], `👨‍💻 <b>Admin javobi:</b>\n\n${text}`, { parse_mode: "HTML" });
    }
    return;
  }

  // Auto Replies
  const lower = text.toLowerCase();
  for (const [key, reply] of autoReplies) {
    if (lower.includes(key)) {
      if (key === "men bilan bog'lan" || key === "bog'lanish" || key === "kontakt") {
        return bot.sendMessage(chatId, socialText, { parse_mode: "HTML" });
      }
      return bot.sendMessage(chatId, reply);
    }
  }

  // Tugmalar
  if (text === "💬 Savol berish" || text === "👨‍💻 Admin bilan gaplashish") {
    userState.set(chatId, true);
    return bot.sendMessage(chatId, "✍️ Xabaringizni yozing, Alyorbek javob beradi...");
  }

  // Xabarni adminga yuborish
  if (userState.get(chatId) || text.length > 3) {
    const forwardText = `📩 <b>Yangi xabar</b>\n\nUser ID: <code>${chatId}</code>\nIsm: ${msg.from.first_name}\nUsername: @${msg.from.username || "yo‘q"}\n\n💬 ${text}`;
    
    bot.sendMessage(ADMIN_ID, forwardText, { parse_mode: "HTML" });

    if (msg.photo || msg.document || msg.voice || msg.video) {
      bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
    }

    bot.sendMessage(chatId, "✅ Xabaringiz Alyorbekka yetkazildi. Javobni kuting.");
    userState.delete(chatId);
  }
});

bot.on("polling_error", (err) => console.error("Polling error:", err.message));

console.log("🚀 Esonaliyev Alyorbekning boti ishga tushdi! (Ijtimoiy tarmoqlar + Bog'lanish qo'shildi)");
