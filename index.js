require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const path = require("path");

const TOKEN = process.env.BOT_TOKEN;
const ADMIN_ID = Number(process.env.ADMIN_ID);

if (!TOKEN) throw new Error("❌ BOT_TOKEN topilmadi. .env faylni tekshir!");
if (!ADMIN_ID) throw new Error("❌ ADMIN_ID topilmadi. .env faylni tekshir!");

const bot = new TelegramBot(TOKEN, { polling: true });

// ====================== PAPKA VA FAYLLAR ======================
const DATA_DIR = "./data";
const USERS_FILE = path.join(DATA_DIR, "users.json");
const GROUPS_FILE = path.join(DATA_DIR, "groups.json");
const BANNED_FILE = path.join(DATA_DIR, "banned.json");
const LOGS_FILE = path.join(DATA_DIR, "logs.json");

let users = new Map();
let groups = new Map();
let bannedUsers = new Set();
let userState = new Map();

// Papkani yaratish
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

// ====================== MA’LUMOTLarni YUKLASH ======================
const loadData = () => {
  if (fs.existsSync(USERS_FILE)) {
    users = new Map(JSON.parse(fs.readFileSync(USERS_FILE, "utf8")));
  }
  if (fs.existsSync(GROUPS_FILE)) {
    groups = new Map(JSON.parse(fs.readFileSync(GROUPS_FILE, "utf8")));
  }
  if (fs.existsSync(BANNED_FILE)) {
    bannedUsers = new Set(JSON.parse(fs.readFileSync(BANNED_FILE, "utf8")));
  }
};

const saveData = () => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(Array.from(users), null, 2));
  fs.writeFileSync(GROUPS_FILE, JSON.stringify(Array.from(groups), null, 2));
  fs.writeFileSync(BANNED_FILE, JSON.stringify(Array.from(bannedUsers), null, 2));
};

const logAction = (action, userId, details = "") => {
  const log = { time: new Date().toISOString(), action, userId, details };
  let logs = fs.existsSync(LOGS_FILE) ? JSON.parse(fs.readFileSync(LOGS_FILE, "utf8")) : [];
  logs.push(log);
  if (logs.length > 1000) logs.shift();
  fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
};

// ====================== JUDA KO‘P AUTO REPLIES ======================
const autoReplies = new Map([
  // Salomlashish
  ["salom", "Salom! 👋 Qanday yordam bera olaman?"],
  ["assalom", "Va alaykum assalom! 😊 Ahvolingiz yaxshimi?"],
  ["assalomu alaykum", "Va alaykum assalom! 👋 Yaxshimisiz?"],

  // Ahvol so‘rash
  ["qalaysiz", "Rahmat, yaxshiman! Sizchi qalaysiz?"],
  ["qalay", "Zo‘r, rahmat! Siz qalaysiz?"],
  ["ahvolingiz", "Shukur, yaxshi. Sizda yangiliklar bormi?"],
  ["qandaysiz", "Yaxshiman, rahmat. Siz-chi?"],

  // Bot haqida
  ["kim bu", "Men Esonaliyev Alyorbekning shaxsiy yordamchi botiman."],
  ["kimsen", "Alyorbekning Telegram botiman 😊"],
  ["sen kim", "Esonaliyev Alyorbekning yordamchi boti"],
  ["bot", "Ha, men Alyorbekning aqlli yordamchi botiman."],

  // Yordam
  ["yordam", "Albatta! Savolingizni yozing, yordam beraman."],
  ["yordam bera", "Yordam berishga tayyorman. Nima haqida gaplashamiz?"],
  ["nima qila", "Savollarga javob beraman, admin bilan bog‘layman."],

  // Rahmat
  ["rahmat", "Arzimaydi! 😊 Yana savollaringiz bo‘lsa yozing."],
  ["katta rahmat", "Hech gap emas, xizmatga tayyorman!"],
  ["raxmat", "Arzimaydi! Doim yordam beraman."],

  // Vaqt
  ["xayrli tong", "Xayrli tong! ☀️ Bugun qanday o‘tadi?"],
  ["xayrli kun", "Xayrli kun! 😊"],
  ["xayrli kech", "Xayrli kech! 🌙 Dam oling."],
  ["tun yaxshi", "Yaxshi tun! 🌙"],
  ["hayr", "Hayr! Yana ko‘rishguncha 👋"],

  // Ijobiy javoblar
  ["zo'r", "Rahmat! Siz ham zo‘rsiz 😎"],
  ["super", "Super! 🔥"],
  ["yaxshi", "Bu juda yaxshi eshitiladi!"],
  ["qanday", "Zo‘r! Sizchi?"],

  // Savol va admin
  ["savol", "Savolingizni yozing, admin javob beradi."],
  ["admin", "Admin bilan gaplashmoqchimisiz? Xabaringizni yozing."],

  // Shaxsiy savollar
  ["necha yosh", "Men botman, yoshim yo‘q 😄"],
  ["qayerdansan", "Men serverda yashayman, egam Esonaliyev Alyorbek."],
  ["ishlayapsizmi", "Men 24/7 ishlayman. Siz nima bilan bandisiz?"],
  ["o'qiysizmi", "Men o‘qimayman, lekin sizga yordam beraman 📚"],

  // Qo‘shimcha keng tarqalgan
  ["bor", "Ha, bor! Nima kerak?"],
  ["yo'q", "Tushundim. Boshqa savol bo‘lsa yozing."],
  ["ha", "Yaxshi, davom eting 😊"],
  ["charchadim", "Dam oling, keyin yozing."],
  ["uyqum kelyapti", "Yaxshi uxlang! Ertaga yozing."],
  ["qiziq", "Qiziqarli! Yana nima deysiz?"],
  ["kulgi", "😂"],
  ["haha", "😂 Qiziq ekan!"],

  // Vaqtinchalik javoblar
  ["kechirasiz", "Hech narsa yo‘q, ayting."],
  ["keting", "Yaxshi, keyinroq yozaman."],
  ["hozir band", "Tushundim, qachon bo‘sh bo‘lsangiz yozing."],
]);

// ====================== YORDAMCHI FUNKSIYALAR ======================
const isAdmin = (chatId) => chatId === ADMIN_ID;
const isBanned = (userId) => bannedUsers.has(userId);

const sendToAdmin = (text, options = {}) => {
  bot.sendMessage(ADMIN_ID, text, { parse_mode: "HTML", ...options }).catch(() => {});
};

const mainKeyboard = {
  resize_keyboard: true,
  keyboard: [
    ["💬 Savol berish"],
    ["👨‍💻 Admin bilan gaplashish"],
    ["❓ FAQ"],
    ["ℹ️ Bot haqida"]
  ]
};

// ====================== START ======================
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const isGroup = msg.chat.type !== "private";

  if (isGroup) {
    groups.set(chatId, { title: msg.chat.title, addedAt: Date.now() });
    saveData();
    return bot.sendMessage(chatId, "✅ Bot guruhga qo‘shildi! Admin xabar yuborishi mumkin.");
  }

  if (isBanned(chatId)) {
    return bot.sendMessage(chatId, "❌ Siz botdan bloklangansiz.");
  }

  users.set(chatId, {
    username: msg.from.username,
    firstName: msg.from.first_name,
    lastActive: Date.now()
  });
  saveData();
  logAction("start", chatId);

  await bot.sendMessage(chatId, `👋 <b>Assalomu alaykum, ${msg.from.first_name}!</b>\n\nMen <b>Esonaliyev Alyorbek</b>ning shaxsiy botiman.`, {
    parse_mode: "HTML",
    reply_markup: mainKeyboard
  });

  sendToAdmin(`🆕 Yangi foydalanuvchi:\nID: <code>${chatId}</code>\nIsm: ${msg.from.first_name}`);
});

// ====================== FAQ VA INFO ======================
bot.onText(/❓ FAQ|\/faq/, (msg) => {
  bot.sendMessage(msg.chat.id, "❓ Savolingizni yozing yoki «👨‍💻 Admin bilan gaplashish» tugmasini bosing.", { parse_mode: "HTML" });
});

bot.onText(/ℹ️ Bot haqida|\/info/, (msg) => {
  bot.sendMessage(msg.chat.id, "🤖 <b>Esonaliyev Alyorbekning shaxsiy boti</b>\n\nDoimiy ravishda takomillashtirilmoqda.", { parse_mode: "HTML" });
});

// ====================== ASOSIY HANDLER ======================
bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text?.trim();
  if (!text) return;

  if (isAdmin(chatId)) {
    // Admin buyruqlari (oldingi versiyadagi kabi qoldim, qisqartirdim)
    if (text === "/users" || text === "/stats") {
      bot.sendMessage(chatId, `👤 Foydalanuvchilar: ${users.size}\n👥 Guruhlar: ${groups.size}`);
    }

    if (msg.reply_to_message) {
      const match = msg.reply_to_message.text?.match(/User ID: (\d+)/);
      if (match) {
        bot.sendMessage(match[1], `👨‍💻 <b>Admin javobi:</b>\n\n${text}`, { parse_mode: "HTML" });
      }
    }
    return;
  }

  // Oddiy foydalanuvchi
  if (isBanned(chatId)) return;

  users.set(chatId, { ...users.get(chatId), lastActive: Date.now() });
  saveData();

  // ====================== AUTO REPLIES ======================
  const lowerText = text.toLowerCase();
  let replied = false;

  for (const [key, reply] of autoReplies) {
    if (lowerText.includes(key)) {
      bot.sendMessage(chatId, reply);
      replied = true;
      break;
    }
  }

  if (replied) return;

  // Menu tugmalari
  if (["💬 Savol berish", "👨‍💻 Admin bilan gaplashish"].includes(text)) {
    userState.set(chatId, true);
    return bot.sendMessage(chatId, "✍️ Xabaringizni yozing, admin javob beradi...");
  }

  // Admin ga yuborish
  if (userState.get(chatId) || text.length > 3) {
    const forwardText = `📩 <b>Yangi xabar</b>\n\nUser ID: <code>${chatId}</code>\nIsm: ${msg.from.first_name}\nUsername: @${msg.from.username || "yo‘q"}\n\n💬 ${text}`;

    sendToAdmin(forwardText);

    if (msg.photo || msg.document || msg.voice || msg.video) {
      bot.forwardMessage(ADMIN_ID, chatId, msg.message_id);
    }

    bot.sendMessage(chatId, "✅ Xabaringiz adminga yetkazildi. Javobni kuting.");
    userState.delete(chatId);
  }
});

// ====================== XATOLAR ======================
bot.on("polling_error", (err) => console.error("Polling error:", err.message));

console.log("🚀 Esonaliyev Alyorbekning boti muvaffaqiyatli ishga tushdi!");
