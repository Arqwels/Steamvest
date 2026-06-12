const ExchangeRate = require('../models/exchangeRateModel');

class ExchangeRateService {
  async getRate(currencyCode) {
    const row = await ExchangeRate.findOne({
      where: { currency_code: currencyCode.toUpperCase() },
    });
    if (!row) throw new Error(`Курс для ${currencyCode} не найден`);
    return row.rate;
  }

  async getAllRates() {
    const rows = await ExchangeRate.findAll();
    if (!rows.length) throw new Error('Таблица курсов пуста');
    return Object.fromEntries(rows.map(r => [r.currency_code, r.rate]));
  }
}

module.exports = new ExchangeRateService();
