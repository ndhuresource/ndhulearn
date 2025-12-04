const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Department = require('./Department');

/**
 * 科系組別模型
 * 代表科系下屬的組別，如學士班、碩士班、博士班
 */
const DepartmentGroup = sequelize.define('DepartmentGroup', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '組別唯一識別ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '組別名稱不能為空'
      },
      len: {
        args: [1, 100],
        msg: '組別名稱長度必須在1到100個字符之間'
      }
    },
    comment: '組別名稱'
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Department,
      key: 'id'
    },
    comment: '所屬科系ID'
  }
}, {
  tableName: 'department_groups',
  timestamps: false,
  underscored: true,
  comment: '科系組別表',
  indexes: [
    {
      unique: true,
      fields: ['department_id', 'name']
    }
  ]
});

module.exports = DepartmentGroup;