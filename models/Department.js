const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const College = require('./College');

/**
 * 科系模型
 * 代表學院下屬的各個科系
 */
const Department = sequelize.define('Department', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '科系唯一識別ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '科系名稱不能為空'
      },
      len: {
        args: [1, 100],
        msg: '科系名稱長度必須在1到100個字符之間'
      }
    },
    comment: '科系名稱'
  },
  college_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: College,
      key: 'id'
    },
    comment: '所屬學院ID'
  }
}, {
  tableName: 'departments',
  timestamps: false,
  underscored: true,
  comment: '科系表',
  indexes: [
    {
      unique: true,
      fields: ['college_id', 'name']
    }
  ]
});

module.exports = Department;