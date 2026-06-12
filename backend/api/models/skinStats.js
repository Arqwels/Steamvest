const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const SkinStats = sequelize.define('skin_stat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  skin_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true
  },
  price_change_day: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  price_change_week: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  price_change_month: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  volume_day: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  volume_week: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  volume_month: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  avg_price_day: {
    type: DataTypes.FLOAT,
    allowNull: true
  },
  updated_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false
});

module.exports = SkinStats;
