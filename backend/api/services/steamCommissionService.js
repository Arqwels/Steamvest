const exchangeRateService = require('./exchangeRateService');

class SteamCommissionService {
  /**
   * Считает комиссию Steam в рублях по формуле:
   * totalFee = price - price / (1 + steamRate + publisherRate)
   *
   * @param {number} priceRub - Цена инвестиции в рублях
   * @param {number} rubPerUsd - Курс рубля (сколько руб за 1 USD)
   * @param {number} publisherFeeRate - Ставка издателя, дефолт 0.10
   */
  calcRub(priceRub, rubPerUsd, publisherFeeRate = 0.10) {
    const steamRate = 0.05;
    const publisherRate = publisherFeeRate;
    const totalRate = steamRate + publisherRate;

    const minFeeRub = parseFloat((0.03 * rubPerUsd).toFixed(2));

    let totalFeeRub = priceRub - priceRub / (1 + totalRate);
    totalFeeRub = Math.max(totalFeeRub, minFeeRub);

    const steamFee = totalFeeRub * (steamRate / totalRate);
    const publisherFee = totalFeeRub * (publisherRate / totalRate);
    const sellerGets = Math.max(priceRub - totalFeeRub, 0);

    return {
      steamFeeRub: parseFloat(steamFee.toFixed(2)),
      publisherFeeRub: parseFloat(publisherFee.toFixed(2)),
      totalFeeRub: parseFloat(totalFeeRub.toFixed(2)),
      sellerGetsRub: parseFloat(sellerGets.toFixed(2)),
    };
  }

  /**
   * Батч-расчёт комиссии для массива инвестиций.
   * Один запрос к БД на весь массив.
   *
   * @param {Array<Object>} items
   * @param {string} priceField - Поле с ценой покупателя в RUB
   * @param {number} publisherFeeRate
   */
  async calcBatch(items, priceField = 'price_skin', publisherFeeRate = 0.10) {
    if (!items.length) return [];

    const rates = await exchangeRateService.getAllRates();
    const rubPerUsd = rates['RUB'];

    return items.map((item) => {
      const priceRub = Number(item[priceField]) || 0;
      return { ...this.calcRub(priceRub, rubPerUsd, publisherFeeRate) };
    });
  }

  /**
   * Суммарный расчёт по всем инвестициям портфеля.
   *
   * @param {Array<{ price_skin: number, countItems: number, buyPrice: number }>} investments
   */
  async calcSummary(investments) {
    const zero = { totalInvested: 0, currentBalance: 0, currentBalanceNet: 0, grossProfit: 0, netProfit: 0 };
    if (!investments.length) return zero;

    const rates = await exchangeRateService.getAllRates();
    const rubPerUsd = rates['RUB'];

    let totalInvested = 0;
    let currentBalance = 0;
    let currentBalanceNet = 0;

    for (const inv of investments) {
      const count = Number(inv.countItems) || 0;
      const buyPrice = Number(inv.buyPrice) || 0;
      const priceSkin = Number(inv.price_skin) || 0;

      totalInvested += buyPrice  * count;
      currentBalance += priceSkin * count;

      const { sellerGetsRub } = this.calcRub(priceSkin, rubPerUsd);
      currentBalanceNet += sellerGetsRub * count;
    }

    const grossProfit = currentBalance - totalInvested;
    const netProfit = currentBalanceNet - totalInvested;

    return {
      totalInvested: +totalInvested.toFixed(2),
      currentBalance: +currentBalance.toFixed(2),
      currentBalanceNet: +currentBalanceNet.toFixed(2),
      grossProfit: +grossProfit.toFixed(2),
      netProfit: +netProfit.toFixed(2),
    };
  }
}

module.exports = new SteamCommissionService();
