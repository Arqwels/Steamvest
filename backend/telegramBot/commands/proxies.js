const axios = require('axios');
const { formatProxiesList } = require('../utils/format');

const API_BASE = process.env.INTERNAL_API_URL || 'http://localhost:3000/api';
const API_KEY  = process.env.INTERNAL_API_KEY;

module.exports = async function proxiesCommand(ctx) {
  await ctx.reply('⏳ Получаю список прокси...');

  try {
    const { data } = await axios.get(`${API_BASE}/admin/proxies`, {
      headers: {},
    });

    if (!data.proxies?.length) {
      return ctx.reply('— прокси не найдены. Используйте /check\\_proxies для синхронизации', { parse_mode: 'Markdown' });
    }

    const text = formatProxiesList(data.proxies, data.summary);

    // Telegram ограничение 4096 символов — режем если нужно
    if (text.length > 4000) {
      const header =
        `🌐 <b>Прокси (${data.summary.total})</b>\n` +
        `🟢 Активных: <b>${data.summary.active}</b> | ` +
        `🟡 Исчерпано: <b>${data.summary.exhausted}</b> | ` +
        `🔴 Мёртвых: <b>${data.summary.dead}</b>\n\n` +
        `⚠️ Список слишком длинный — показана только сводка.`;
      return ctx.reply(header, { parse_mode: 'HTML' });
    }

    await ctx.reply(text, { parse_mode: 'HTML' });
  } catch (err) {
    console.error('[TelegramBot/proxies]', err.message);
    await ctx.reply(`❌ Ошибка: ${err.message}`);
  }
};
