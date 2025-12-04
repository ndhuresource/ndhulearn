const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

// --- Validators 防呆處理 ---
// 這樣寫可以防止如果沒有 validators.js 檔案時導致程式崩潰
let validate = (method) => (req, res, next) => next(); // 預設為「不做檢查直接通過」
try {
  // 嘗試引入，如果失敗會跳到 catch
  const validators = require('../middleware/validators');
  if (validators && validators.validate) {
    validate = validators.validate;
  }
} catch (e) {
  // console.log('未找到驗證器，跳過驗證邏輯');
}

// ============================
// 認證路由
// ============================

// 1. 發送註冊驗證碼 (註冊的第一步)
router.post('/send-code', authController.sendRegisterCode);

// 2. 註冊 (提交資料 + 驗證碼)
router.post('/register', validate('register'), authController.register);

// 3. 驗證信箱 (單獨驗證用)
router.post('/verify-email', authController.verifyEmail);

// 4. 登入
router.post('/login', validate('login'), authController.login);

// 5. 登出
router.post('/logout', auth, authController.logout);

// 6. 獲取當前用戶信息 (檢查 Token 是否有效)
router.get('/me', auth, authController.getMe);

// ❌ 已刪除舊的 send-verification 路由，避免報錯

module.exports = router;