const puppeteer = require('puppeteer');
const ExchangeRate = require('../../api/models/exchangeRateModel');

const RATES_URL = 'https://api.steaminventoryhelper.com/steam-rates?base=USD';

class RateParserService {
  /**
   * Получает курсы валют с steaminventoryhelper и сохраняет в БД.
   * Используется при старте сервера и по крону каждые 6 часов.
   */
  async fetchAndSaveRates() {
    let browser;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      const response = await page.goto(RATES_URL, { waitUntil: 'networkidle2', timeout: 15000 });
      if (!response.ok()) throw new Error(`Ошибка ответа: ${response.status()}`);

      const text = await page.evaluate(() => document.body.innerText);
      const json = JSON.parse(text);

      if (!json?.success || !json?.data?.rates) {
        throw new Error('Неверная структура ответа от steaminventoryhelper');
      }

      const rows = Object.entries(json.data.rates).map(([currency_code, rate]) => ({
        currency_code,
        rate,
      }));

      await ExchangeRate.bulkCreate(rows, {
        updateOnDuplicate: ['rate', 'updated_at'],
      });

      console.log(`[RateParser] Обновлено ${rows.length} курсов валют`);
    } finally {
      if (browser) await browser.close();
    }
  }
}

module.exports = new RateParserService();
