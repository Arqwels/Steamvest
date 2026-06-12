const sequelize = require('../../db');
const Invest = require('./investModel');
const Portfolio = require('./portfolioModel');
const Sale = require('./saleModel');
const SkinChart = require('./skinChart');
const SkinPriceHistory = require('./skinPriceHistory');
const Skins = require('./skinsModel');
const SkinStats = require('./skinStats');

module.exports = {
  sequelize,
  Skins,
  Invest,
  SkinPriceHistory,
  Portfolio,
  Sale,
  SkinChart,
  SkinStats,
};
