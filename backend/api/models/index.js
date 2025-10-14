const sequelize = require('../../db');
const Invest = require('./investModel');
const Portfolio = require('./portfolioModel');
const Sale = require('./saleModel');
const SkinPriceHistory = require('./skinPriceHistory');
const Skins = require('./skinsModel');

module.exports = {
  sequelize,
  Skins,
  Invest,
  SkinPriceHistory,
  Portfolio,
  Sale,
};
