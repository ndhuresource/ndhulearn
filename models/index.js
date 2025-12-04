// models/index.js
const sequelize = require('../config/database');

// 導入所有模型
const User = require('./User');
const College = require('./College');
const Department = require('./Department');
const DepartmentGroup = require('./DepartmentGroup');
const Course = require('./Course');
const Curriculum = require('./Curriculum');
const Resource = require('./Resource');
const ResourceRating = require('./ResourceRating');
const DownloadHistory = require('./DownloadHistory');
const VerificationCode = require('./VerificationCode');

// 定義模型關聯（如果有的話）
// 例如: User.hasMany(Resource, { foreignKey: 'uploader_id' });

// 導出 Sequelize 實例和所有模型
module.exports = {
  sequelize,
  User,
  College,
  Department,
  DepartmentGroup,
  Course,
  Curriculum,
  Resource,
  ResourceRating,
  DownloadHistory,
  VerificationCode
};