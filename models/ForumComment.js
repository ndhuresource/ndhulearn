const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumComment = sequelize.define('ForumComment', {
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
  // 🔥 關鍵修正：新增匿名欄位
  is_anonymous: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: '是否匿名留言'
  }
}, {
  tableName: 'forum_comments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  comment: '聊天版留言'
});

module.exports = ForumComment;