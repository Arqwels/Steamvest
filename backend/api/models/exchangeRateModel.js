const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const ExchangeRate = sequelize.define('exchange_rate', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  currency_code: {
    type: DataTypes.STRING(10),
    allowNull: false,
    unique: true,
  },
  rate: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
}, {
  timestamps: true,
  createdAt: false,
  updatedAt: 'updated_at',
});
 
module.exports = ExchangeRate;
