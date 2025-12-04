const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Resource = require('./Resource');

/**
 * 下載記錄模型
 * 記錄使用者下載資源的歷史
 */
const DownloadHistory = sequelize.define('DownloadHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '下載記錄唯一識別ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'id'
    },
    comment: '使用者ID'
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Resource,
      key: 'id'
    },
    comment: '資源ID'
  }
}, {
  tableName: 'download_history',
  timestamps: true,
  createdAt: 'download_time',
  updatedAt: false,
  comment: '下載記錄表'
});

module.exports = DownloadHistory;