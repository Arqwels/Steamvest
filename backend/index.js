require('dotenv').config()
require('./parser');
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const apiRouter = require('./api/routes/index');
const initAssociations = require('./api/models/associations');
const cookieParser = require('cookie-parser');
const errorMiddleware = require('./api/middlewares/errorMiddleware');

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

const start = async () => {
  try {
    await sequelize.authenticate();

    // ▼ Добавь это временно ▼
    // const SkinStats = require('./api/models/skinStats');
    // const SkinChart = require('./api/models/skinChart');
    // await SkinStats.sync({ force: true });
    // await SkinChart.sync({ force: true });
    // console.log('✅ Таблицы skin_stats и skin_charts пересозданы');
    // ▲ После запуска удали эти 5 строк ▲

    await sequelize.sync();

    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту - ${PORT}`)
    });
  } catch (error) {
    console.log(`⛔ Ошибка с подключение к БД - ${error}`)
  }
};

start();
