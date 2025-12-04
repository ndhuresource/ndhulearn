// 1. 引入 ShopItem 模型 (關鍵修改)
const { User, VerificationCode, ShopItem } = require('../models/associations');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { sendVerificationEmail } = require('../utils/email');

const authController = {
  // 1. 發送註冊驗證碼
  sendRegisterCode: async (req, res) => {
    try {
      const { email, username } = req.body;
      if (!email || !email.toLowerCase().endsWith('@gms.ndhu.edu.tw')) {
        return res.status(400).json({ message: '請使用東華大學信箱 (@gms.ndhu.edu.tw)' });
      }
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(409).json({ message: '此信箱已註冊，請直接登入' });
      }
      await sendVerificationEmail(email, username || '同學');
      res.json({ success: true, message: '驗證碼已發送至您的信箱' });
    } catch (error) {
      console.error('發送驗證碼失敗:', error);
      res.status(500).json({ message: '發送失敗，請稍後再試', error: error.message });
    }
  },

  // 2. 註冊
  register: async (req, res) => {
    try {
      const { studentId, username, email, password, code } = req.body;

      if (!studentId || !username || !email || !password) {
        return res.status(400).json({ message: '所有欄位皆為必填' });
      }

      // 檢查驗證碼
      if (code) {
        const validCode = await VerificationCode.findOne({
          where: {
            email: email.toLowerCase(),
            code: code,
            is_used: 0,
            expires_at: { [Op.gt]: new Date() }
          }
        });

        if (!validCode) {
          return res.status(400).json({ message: '驗證碼錯誤或已過期' });
        }
        
        validCode.is_used = 1;
        await validCode.save();
      }

      const existingUserByStudentId = await User.findOne({ where: { student_id: studentId } });
      if (existingUserByStudentId) return res.status(409).json({ message: '學號已被註冊' });
      
      const existingUserByEmail = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUserByEmail) return res.status(409).json({ message: '信箱已被註冊' });

      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 建立使用者
      const user = await User.create({
        student_id: studentId,
        username,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        is_verified: code ? 1 : 0,
        current_points: 0,
        total_checkins: 0,
      });

      // 強制等待資料庫同步
      await new Promise(resolve => setTimeout(resolve, 100));
      const checkUser = await User.findByPk(user.id);
      
      if (!checkUser) {
        return res.status(500).json({ message: '註冊寫入延遲，請稍後再試' });
      }

      if (!code) {
        try {
          await sendVerificationEmail(user.email, user.username);
        } catch (emailError) {
          console.error('註冊後發信失敗:', emailError);
        }
      }

      res.status(201).json({
        success: true,
        message: '註冊成功！',
        user: {
          id: checkUser.id,
          student_id: checkUser.student_id,
          username: checkUser.username,
          email: checkUser.email,
          theme_id: checkUser.theme_id
        }
      });

    } catch (error) {
      console.error('註冊錯誤:', error);
      res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
  },

  // 3. 登入 (🔥🔥🔥 關鍵修正處 🔥🔥🔥)
  login: async (req, res) => {
    try {
      const { studentId, password } = req.body;

      // 第一次查詢
      let user = await User.findOne({ where: { student_id: studentId } });
      
      // Retry 機制
      if (!user) {
        await new Promise(r => setTimeout(r, 100));
        user = await User.findOne({ where: { student_id: studentId } });
      }

      if (!user) return res.status(401).json({ message: '學號或密碼錯誤' });

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) return res.status(401).json({ message: '學號或密碼錯誤' });

      const token = jwt.sign(
        { id: user.id, studentId: user.student_id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      user.last_login = new Date();
      await user.save();

      // 🔥 查詢主題樣式代碼 (從 ShopItem 表獲取 JSON)
      let themeStyles = null;
      if (user.theme_id) {
        try {
          const themeItem = await ShopItem.findByPk(user.theme_id);
          // 資料庫中 item_url 欄位存的是 JSON 字串
          if (themeItem && themeItem.item_url) {
            themeStyles = themeItem.item_url;
          }
        } catch (err) {
          console.error("查詢主題失敗:", err);
        }
      }

      res.json({
        success: true,
        message: '登入成功',
        token,
        user: {
          id: user.id,
          student_id: user.student_id,
          username: user.username,
          email: user.email,
          points: user.current_points,
          avatar_url: user.avatar_url,
          theme_id: user.theme_id,
          // ✅ 這裡把查詢到的 JSON 傳給前端 App.jsx
          themeStyles: themeStyles 
        }
      });
    } catch (error) {
      console.error('登入錯誤:', error);
      res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
  },

  // 4. 登出
  logout: async (req, res) => {
    res.json({ success: true, message: '登出成功' });
  },

  // 5. 獲取當前用戶信息 (🔥🔥🔥 一併修正，確保重新整理頁面時主題不跑掉 🔥🔥🔥)
  getMe: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password_hash'] }
      });
      if (!user) return res.status(404).json({ message: '使用者不存在' });
      
      // 🔥 查詢主題樣式
      let themeStyles = null;
      if (user.theme_id) {
        const themeItem = await ShopItem.findByPk(user.theme_id);
        if (themeItem) themeStyles = themeItem.item_url;
      }

      // 將 user 轉換為 plain object 才能添加新屬性
      const userData = user.toJSON();
      userData.themeStyles = themeStyles;

      res.json({ success: true, data: userData });
    } catch (error) {
      console.error("GetMe Error:", error);
      res.status(500).json({ message: '伺服器錯誤' });
    }
  },

  // 6. 驗證信箱
  verifyEmail: async (req, res) => {
    try {
      const { email, code } = req.body;
      const verificationCode = await VerificationCode.findOne({
        where: {
          email: email.toLowerCase(),
          code,
          is_used: 0,
          expires_at: { [Op.gt]: new Date() }
        }
      });
      if (!verificationCode) return res.status(400).json({ message: '驗證碼無效或已過期' });

      verificationCode.is_used = 1;
      await verificationCode.save();

      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (user) {
        user.is_verified = 1;
        await user.save();
      }
      res.json({ success: true, message: '郵箱驗證成功' });
    } catch (error) {
      res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
  }
};

module.exports = authController;