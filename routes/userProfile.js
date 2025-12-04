const express = require('express');
const router = express.Router();
const userProfileController = require('../controllers/userProfileController');
const auth = require('../middleware/auth');

// 全部需要登入
router.get('/me', auth, userProfileController.getProfile);     // 取得自己的詳細資料
router.put('/avatar', auth, userProfileController.updateAvatar); // 更新個人資料 (含裝備、暱稱、密碼)

module.exports = router;