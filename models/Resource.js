const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * 資源模型
 */
const Resource = sequelize.define('Resource', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '資源唯一識別ID'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: { msg: '資源標題不能為空' },
      len: { args: [1, 200], msg: '資源標題長度必須在1到200個字符之間' }
    },
    comment: '資源標題'
  },
  course_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: '課程代碼'
  },
  teacher: {
    type: DataTypes.STRING(100),
    allowNull: true,
    validate: {
      len: { args: [0, 100], msg: '教師姓名長度不能超過100個字符' }
    },
    comment: '授課教師'
  },
  uploader_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '上傳者ID'
  },
  resource_type: {
    type: DataTypes.ENUM('期中', '期末', '筆記'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['期中', '期末', '筆記']],
        msg: '資源類型必須是期中、期末或筆記'
      }
    },
    comment: '資源類型'
  },
  file_path: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: { msg: '文件路徑不能為空' }
    },
    comment: '檔案儲存key或路徑 (Cloudinary URL)'
  },
  file_size: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: '檔案大小'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'MIME類型'
  },

  // 🔥 這是剛剛請你用 SQL 補上的欄位，必須要有它，下載功能才會正常！
  original_filename: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '原始檔名'
  },

  year: {
    type: DataTypes.INTEGER, // Sequelize 處理 YEAR 類型通常用 INTEGER
    allowNull: false,
    validate: {
      min: { args: 1900, msg: '年份必須大於等於1900' },
      max: { args: new Date().getFullYear() + 1, msg: '年份不能超過明年' }
    },
    comment: '年份'
  },
  grade_level: {
    type: DataTypes.ENUM('學士', '碩士', '博士'),
    allowNull: false,
    validate: {
      isIn: {
        args: [['學士', '碩士', '博士']], 
        msg: '學制必須是學士、碩士或博士'
      }
    },
    comment: '學制'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '資源描述'
  },
  download_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '下載次數'
  },
  // 對應你的 TINYINT DEFAULT 0
  is_anonymous: {
    type: DataTypes.BOOLEAN, 
    defaultValue: false,
    comment: '是否匿名 (0:否, 1:是)'
  },
  upload_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: '上傳時間'
  }
}, {
  tableName: 'resources',
  timestamps: false, // 關閉自動的 createdAt/updatedAt，因為你有 upload_time
  underscored: true, // 自動轉成 snake_case
  indexes: [
    { fields: ['course_id'] },
    { fields: ['uploader_id'] },
    { fields: ['resource_type', 'year'] }
  ]
});

module.exports = Resource;