const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const Sale = sequelize.define('sale', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  skinId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'skins', key: 'id' },
  },
  portfolioId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'portfolios', key: 'id' },
  },
  countSale: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priceSale: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  priceBuy: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  dateSale: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'sales',
  timestamps: true,
});

module.exports = Sale;
