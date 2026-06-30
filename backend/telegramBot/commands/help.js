module.exports = async function helpCommand(ctx) {
  await ctx.reply(
    `<b>📖 Steamvest Admin Bot — команды</b>\n\n` +
    `<b>Парсеры</b>\n` +
    `/status — текущий статус обоих парсеров\n` +
    `/lastrun_skins — последние 5 прогонов Skins Parser\n` +
    `/lastrun_stats — последние 5 прогонов Stats Parser\n\n` +
    `<b>Прокси</b>\n` +
    `/proxies — список всех прокси со статусами\n` +
    `/check_proxies — запустить проверку прокси\n\n` +
    `<b>Статусы прокси</b>\n` +
    `🟢 active — работает\n` +
    `🟡 exhausted — Steam даёт 429\n` +
    `🔴 dead — нет соединения`,
    { parse_mode: 'HTML' }
  );
};
