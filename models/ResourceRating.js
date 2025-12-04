const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// 修改 1: 移除 User 和 Resource 的引入，避免循環依賴

/**
 * 資源評分模型
 * 代表使用者對資源的評分
 */
const ResourceRating = sequelize.define('ResourceRating', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '評分唯一識別ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // 修改 2: 移除 references，由 associations.js 處理
    comment: '評分用戶ID'
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    // 修改 2: 移除 references
    comment: '被評分資源ID'
  },
  completeness: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: { args: 1, msg: '內容完整性評分必須在1到5之間' },
      max: { args: 5, msg: '內容完整性評分必須在1到5之間' }
    },
    comment: '內容完整性評分(1-5)'
  },
  accuracy: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: { args: 1, msg: '內容準確性評分必須在1到5之間' },
      max: { args: 5, msg: '內容準確性評分必須在1到5之間' }
    },
    comment: '內容準確性評分(1-5)'
  },
  relevance: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: { args: 1, msg: '內容相關性評分必須在1到5之間' },
      max: { args: 5, msg: '內容相關性評分必須在1到5之間' }
    },
    comment: '內容相關性評分(1-5)'
  },
  readability: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: { args: 1, msg: '易讀性評分必須在1到5之間' },
      max: { args: 5, msg: '易讀性評分必須在1到5之間' }
    },
    comment: '易讀性評分(1-5)'
  },
  credibility: {
    type: DataTypes.TINYINT,
    allowNull: false,
    validate: {
      min: { args: 1, msg: '來源可信度評分必須在1到5之間' },
      max: { args: 5, msg: '來源可信度評分必須在1到5之間' }
    },
    comment: '來源可信度評分(1-5)'
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '文字評論'
  },
  // 修改 3: 新增匿名欄位 (對應資料庫新增的欄位)
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否匿名'
  }
}, {
  tableName: 'resource_ratings',
  timestamps: true,
  createdAt: 'rating_time', // 對應資料庫的 rating_time
  updatedAt: false,         // 資料庫沒有 updated_at
  comment: '資源評分表',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'resource_id']
    },
    {
      fields: ['resource_id']
    },
    {
      fields: ['user_id']
    }
  ]
});

module.exports = ResourceRating;