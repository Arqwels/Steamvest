const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const ProxyModel = sequelize.define('proxies', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  url: {
    type: DataTypes.STRING(512),
    allowNull: false,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'exhausted', 'dead'),
    defaultValue: 'active',
    allowNull: false,
  },
  fail_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_used_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  last_checked_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Есть ли вообще сеть через прокси
  is_alive: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
  // Доступен ли Steam через прокси
  is_steam_ok: {
    type: DataTypes.BOOLEAN,
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = ProxyModel;