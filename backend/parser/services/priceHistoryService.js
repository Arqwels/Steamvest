const SkinPriceHistory = require('../../api/models/skinPriceHistory');
const { chunkArray } = require('../../api/utils/chunk');

class PriceHistoryService {
  async recordHistory(skinsFromDb, skinsData) {
    const records = skinsData.map(item => ({
      skinId: skinsFromDb.find(s => s.market_hash_name === item.hash_name).id,
      price_skin: item.sell_price / 100,
      recorded_at: new Date()
    }));
    for (const chunk of chunkArray(records, 500)) {
      await SkinPriceHistory.bulkCreate(chunk);
    }
  }
}

module.exports = new PriceHistoryService();
