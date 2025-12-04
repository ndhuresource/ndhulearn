const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ForumPost = sequelize.define('ForumPost', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '發文者ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '標題'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '內容'
  },
  // 🔥 新增：圖片欄位
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '貼文圖片URL'
  },
  // 🔥 新增：匿名欄位
  is_anonymous: {
    type: DataTypes.BOOLEAN, // 資料庫是 TINYINT(1)，這裡用 BOOLEAN 對應
    defaultValue: false,
    comment: '是否匿名'
  },
  comment_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '留言數'
  },
  like_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '點讚數'
  }
}, {
  tableName: 'forum_posts',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  comment: '聊天版貼文'
});

module.exports = ForumPost;