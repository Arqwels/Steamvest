require('dotenv').config()
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const apiRouter = require('./api/routes/index');
const initAssociations = require('./api/models/associations');
const cron = require('node-cron');
const { fetchAndSaveSkins } = require('./api/services/skinsTaskService');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./api/middlewares/errorMiddleware');
const { fetchAndSaveRates } = require('./api/services/exchangeRateService');

const app = express();
const PORT = process.env.PORT || 2000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));
app.use('/api', apiRouter);
app.use(errorMiddleware);

// Импорт моделей и ассоциаций
initAssociations();

// Сделать запрос через node-cron

// Запланировать выполнение задачи каждые 6 часов (в 0 минут каждого 6-го часа)
// cron.schedule('0 */6 * * *', async () => {
//   console.log('Запуск задачи: получение скинов и сохранение истории цен');
//   try {
//     await fetchAndSaveSkins();
//     console.log('Данные успешно обновлены.');
//   } catch (error) {
//     console.error("Ошибка при выполнении запланированной задачи:", error);
//   }
// });

// Крон курсов валют — каждые 6 часов
cron.schedule('0 */6 * * *', async () => {
  console.log('[Cron] Обновление курсов валют...');
  try {
    await fetchAndSaveRates();
  } catch (error) {
    console.error('[Cron] Ошибка при обновлении курсов:', error.message);
  }
});

const start = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту - ${PORT}`)
    });
  } catch (error) {
    console.log(`⛔ Ошибка с подключение к БД - ${error}`)
  }
};

start();
