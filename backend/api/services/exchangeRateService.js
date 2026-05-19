const puppeteer = require('puppeteer');
const ExchangeRate = require('../models/exchangeRateModel');

const RATES_URL = 'https://api.steaminventoryhelper.com/steam-rates?base=USD';

class ExchangeRateService {
  /**
   * Получает курсы валют с steaminventoryhelper и сохраняет в БД.
   * Используется при старте сервера и по крону каждые 6 часов.
   */
  async fetchAndSaveRates() {
    let browser;

    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
        ],
      });

      const page = await browser.newPage();

      // Имитируем обычный браузер
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      );

      const response = await page.goto(RATES_URL, {
        waitUntil: 'networkidle2',
        timeout: 15000,
      });

      if (!response.ok()) {
        throw new Error(`Ошибка ответа: ${response.status()}`);
      }

      // Страница вернёт JSON — читаем текст и парсим
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

      console.log(`[ExchangeRate] Обновлено ${rows.length} курсов валют`);
    } finally {
      if (browser) await browser.close();
    }
  }

  /**
   * Возвращает курс одной валюты из БД.
   *
   * @param {string} currencyCode - Код валюты (например 'RUB', 'USD')
   */
  async getRate(currencyCode) {
    const row = await ExchangeRate.findOne({
      where: { currency_code: currencyCode.toUpperCase() },
    });

    if (!row) {
      throw new Error(`Курс для ${currencyCode} не найден в БД. Запусти fetchAndSaveRates().`);
    }

    return row.rate;
  }

  /**
   * Возвращает все курсы валют из БД в виде объекта { USD: 1, RUB: 73.3, ... }
   */
  async getAllRates() {
    const rows = await ExchangeRate.findAll();

    if (!rows.length) {
      throw new Error('Таблица курсов пуста. Запусти fetchAndSaveRates().');
    }

    return Object.fromEntries(rows.map(r => [r.currency_code, r.rate]));
  }
}

module.exports = new ExchangeRateService();
