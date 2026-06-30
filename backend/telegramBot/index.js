const { Telegraf } = require('telegraf');
const { HttpsProxyAgent } = require('https-proxy-agent');
const statusCommand = require('./commands/status');
const lastrunCommand = require('./commands/lastrun');
const proxiesCommand = require('./commands/proxies');
const checkCommand = require('./commands/check');
const helpCommand = require('./commands/help');

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID;
const PROXY_URL = process.env.TELEGRAM_PROXY;

console.log('[TelegramBot] TOKEN:', process.env.TELEGRAM_BOT_TOKEN ? '✅ есть' : '❌ НЕТ');
console.log('[TelegramBot] ADMIN_ID:', process.env.TELEGRAM_ADMIN_CHAT_ID ?? '❌ НЕТ');

if (!BOT_TOKEN) {
  console.error('[TelegramBot] TELEGRAM_BOT_TOKEN не задан — выход');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN, {
  telegram: {
    agent: PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : undefined,
  }
});

// ─── Middleware: только админ ─────────────────────────────────────
bot.use(async (ctx, next) => {
  const chatId = String(ctx.chat?.id);
  if (chatId !== String(ADMIN_CHAT_ID)) {
    await ctx.reply('⛔ Нет доступа');
    return;
  }
  return next();
});

// ─── Команды ──────────────────────────────────────────────────────
bot.command('start', (ctx) => ctx.reply(
  '👋 Steamvest Admin Bot\n\nКоманды:\n' +
  '/status — текущие прогоны\n' +
  '/lastrun\\_skins — последний прогон скинов\n' +
  '/lastrun\\_stats — последний прогон статистики\n' +
  '/proxies — статус прокси\n' +
  '/check\\_proxies — запустить проверку прокси\n' +
  '/help — все команды',
  { parse_mode: 'Markdown' }
));

bot.command('status', statusCommand);
bot.command('lastrun_skins', (ctx) => lastrunCommand(ctx, 'skins'));
bot.command('lastrun_stats', (ctx) => lastrunCommand(ctx, 'stats'));
bot.command('proxies', proxiesCommand);
bot.command('check_proxies', checkCommand);
bot.command('help', helpCommand);

// ─── Запуск ───────────────────────────────────────────────────────
bot.launch()
  .then(() => console.log('[TelegramBot] ✅ Запущен, polling активен'))
  .catch(err => {
    console.error('[TelegramBot] ❌ Ошибка запуска:', err.message);
    console.error('[TelegramBot] Детали:', err);
    process.exit(1);
  });

// Graceful shutdown
process.once('SIGINT',  () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
