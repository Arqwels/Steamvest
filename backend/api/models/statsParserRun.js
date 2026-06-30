const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const StatsParserRun = sequelize.define('stats_parser_runs', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  started_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  finished_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('running', 'completed', 'stopped'),
    defaultValue: 'running',
    allowNull: false,
  },
  // Сколько скинов взято из таблицы skins для обработки
  total_skins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  success_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Только здесь — у skinsParser прокси не нужны
  proxies_used: {
    type: DataTypes.JSONB,
    defaultValue: [],
  },
  stop_reason: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = StatsParserRun;
