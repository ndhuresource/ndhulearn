const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 課程模型
 * 代表學校開設的課程
 */
const Course = sequelize.define('Course', {
  id: {
    type: DataTypes.STRING(20),
    primaryKey: true,
    comment: '課程代碼'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '課程名稱不能為空'
      },
      len: {
        args: [1, 200],
        msg: '課程名稱長度必須在1到200個字符之間'
      }
    },
    comment: '課程名稱'
  },
  course_level: {
    type: DataTypes.ENUM('學士', '碩士', '博士'),
    defaultValue: '學士',
    validate: {
      isIn: {
        args: [['學士', '碩士', '博士']],
        msg: '課程級別必須是學士、碩士或博士'
      }
    },
    comment: '課程級別'
  }
}, {
  tableName: 'courses',
  timestamps: false,
  comment: '課程表'
});

module.exports = Course;