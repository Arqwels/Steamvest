const sequelize = require('../../db');
const Invest = require('./investModel');
const Portfolio = require('./portfolioModel');
const ProxyModel = require('./proxyModel');
const Sale = require('./saleModel');
const SkinChart = require('./skinChart');
const SkinPriceHistory = require('./skinPriceHistory');
const Skins = require('./skinsModel');
const SkinsParserRun = require('./skinsParserRun');
const SkinStats = require('./skinStats');
const StatsParserRun = require('./statsParserRun');

module.exports = {
  sequelize,
  Skins,
  Invest,
  SkinPriceHistory,
  Portfolio,
  Sale,
  SkinChart,
  SkinStats,
  SkinsParserRun,
  StatsParserRun,
  ProxyModel,
};
