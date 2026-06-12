const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const SkinChart = sequelize.define('skin_chart', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  skin_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  volume: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  chart_period: {
    type: DataTypes.STRING(5),
    allowNull: true
  },
  recorded_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  timestamps: false,
  indexes: [
    { fields: ['skin_id', 'recorded_at'] }
  ]
});

module.exports = SkinChart;
