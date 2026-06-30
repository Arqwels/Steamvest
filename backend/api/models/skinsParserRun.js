const { DataTypes } = require('sequelize');
const sequelize = require('../../db');

const SkinsParserRun = sequelize.define('skins_parser_runs', {
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
  // Сколько скинов вернул Steam Market
  total_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  // Сколько успешно записано / обновлено в БД
  saved_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  failed_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  stop_reason: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
}, {
  timestamps: false,
});

module.exports = SkinsParserRun;
