const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Department = require('./Department');
const Course = require('./Course');
const College = require('./College');
const DepartmentGroup = require('./DepartmentGroup');

/**
 * 培養方案模型
 * 代表課程與科系/組別的對應關係
 */
const Curriculum = sequelize.define('Curriculum', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '培養方案唯一識別ID'
  },
  department_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Department,
      key: 'id'
    },
    comment: '科系ID'
  },
  course_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    references: {
      model: Course,
      key: 'id'
    },
    comment: '課程代碼'
  },
  college_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: College,
      key: 'id'
    },
    comment: '開課學院ID'
  },
  group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: DepartmentGroup,
      key: 'id'
    },
    comment: '組別ID（NULL表示整個科系）'
  },
  type: {
    type: DataTypes.ENUM('必修', '選修', '通識'),
    defaultValue: '必修',
    validate: {
      isIn: {
        args: [['必修', '選修', '通識']],
        msg: '課程類型必須是必修、選修或通識'
      }
    },
    comment: '課程類型'
  }
}, {
  tableName: 'curriculums',
  timestamps: false,
  underscored: true,
  comment: '培養方案表',
  indexes: [
    {
      unique: true,
      fields: ['department_id', 'course_id', 'group_id']
    },
    {
      fields: ['department_id']
    },
    {
      fields: ['college_id']
    },
    {
      fields: ['group_id']
    },
    {
      fields: ['type']
    }
  ]
});

module.exports = Curriculum;