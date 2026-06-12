const SkinsModel = require('../../api/models/skinsModel');
const { getCurrencyAndPrice } = require('../../api/utils/currency');
const { chunkArray } = require('../../api/utils/chunk');

class SkinsService {
  async upsertSkins(skinsData) {
    const payload = skinsData.map(item => {
      // Определяем цену и валюту
      const { price, currency_code } = getCurrencyAndPrice(item);
      // Собираем полный URL изображения из asset_description.icon_url
      const iconHash = item.asset_description?.icon_url;
      const image_url = iconHash
        ? `https://community.fastly.steamstatic.com/economy/image/${iconHash}`
        : item.app_icon; // fallback на старый app_icon

      return {
        market_name: item.name,
        market_hash_name: item.hash_name,
        price_skin: price,
        image_url, // теперь используем конкатенацию
        currency_code,
        date_update: new Date()
      };
    });

    // bulk upsert чанками
    for (const chunk of chunkArray(payload, 500)) {
      await SkinsModel.bulkCreate(chunk, {
        updateOnDuplicate: [
          'market_name',
          'price_skin',
          'image_url',
          'currency_code',
          'date_update'
        ]
      });
    }

    // Возвращаем обновленные записи
    return SkinsModel.findAll({
      where: { market_hash_name: skinsData.map(s => s.hash_name) }
    });
  }
}

module.exports = new SkinsService();
