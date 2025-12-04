const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

/**
 * 使用者模型
 * 代表系統的使用者
 */
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: '使用者唯一識別ID'
  },
  student_id: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: {
      msg: '學號已存在'
    },
    validate: {
      notEmpty: {
        msg: '學號不能為空'
      }
    },
    comment: '學號'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '姓名不能為空'
      },
      len: {
        args: [1, 50],
        msg: '姓名長度必須在1到50個字符之間'
      }
    },
    comment: '姓名'
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: '密碼雜湊不能為空'
      }
    },
    comment: '密碼雜湊 (bcrypt)'
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      msg: '郵箱已存在'
    },
    validate: {
      isEmail: {
        msg: '郵箱格式無效'
      },
      isNDHUEmail(value) {
        if (!value.toLowerCase().endsWith('@gms.ndhu.edu.tw')) {
          throw new Error('必須使用東華大學郵箱 (@gms.ndhu.edu.tw)');
        }
      }
    },
    comment: '東華郵箱'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最後登入時間'
  },
  is_verified: {
    type: DataTypes.BOOLEAN, // MySQL TINYINT(1)
    defaultValue: false,
    comment: '郵箱驗證狀態'
  },
  // ==========================================
  // 新增：點數與個人化欄位
  // ==========================================
  current_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '當前點數'
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: '頭像URL'
  },
  avatar_frame_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '當前使用的頭像框ID'
  },
  // 🔥🔥🔥 新增以下兩個欄位以配合資料庫 🔥🔥🔥
  badge_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '當前使用的徽章ID'
  },
  theme_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '當前使用的主題ID'
  },
  // 🔥🔥🔥 新增結束 🔥🔥🔥
  
  total_checkins: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: '累計簽到次數'
  }
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at', // 明確指定對應資料庫欄位
  updatedAt: 'updated_at', // 明確指定對應資料庫欄位
  underscored: true,       // 確保 Sequelize 使用底線命名法處理關聯
  comment: '使用者表',
  hooks: {
    beforeCreate: async (user) => {
      if (user.email) {
        user.email = user.email.toLowerCase();
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('email') && user.email) {
        user.email = user.email.toLowerCase();
      }
    }
  }
});

// 實例方法：驗證密碼
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password_hash);
};

// 類方法：根據學號查找用戶
User.findByStudentId = function(studentId) {
  return this.findOne({ where: { student_id: studentId } });
};

// 類方法：根據郵箱查找用戶
User.findByEmail = function(email) {
  return this.findOne({ where: { email: email.toLowerCase() } });
};

module.exports = User;