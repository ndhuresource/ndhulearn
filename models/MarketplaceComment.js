const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MarketplaceComment = sequelize.define('MarketplaceComment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  post_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '貼文ID'
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '留言者ID'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '留言內容'
  },
  // 🔥 新增：匿名欄位 (對應資料庫的 TINYINT)
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否匿名'
  }
}, {
  tableName: 'marketplace_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false, // 資料庫中沒有 updated_at 欄位
  underscored: true, // 自動將 camelCase 轉為 snake_case (雖此處無影響，但建議加上)
  comment: '買賣版留言'
});

module.exports = MarketplaceComment;