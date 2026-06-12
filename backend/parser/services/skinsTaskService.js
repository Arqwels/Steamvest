const steamService = require('./steamService');
const skinsService = require('./skinsService');
const priceHistoryService = require('./priceHistoryService');
const steamAuthService = require('./steamAuthService');

async function fetchAndSaveSkins(limit = null) {
  // Обновляем secure token
  const secureToken = await steamAuthService.init();
  steamService.setLoginSecure(secureToken);

  // Получаем сырые данные
  const raw = await steamService.fetchAllSkins(limit);

  // Убираем дубликаты по hash_name
  const unique = [...new Map(raw.map(item => [item.hash_name, item])).values()];

  // Записываем или обновляем скины в БД
  const dbSkins = await skinsService.upsertSkins(unique);

  // Фиксируем историю цен
  await priceHistoryService.recordHistory(dbSkins, unique);

  return unique;
}

module.exports = { fetchAndSaveSkins };
