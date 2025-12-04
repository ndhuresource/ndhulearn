const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// 獲取使用者上傳的資源
router.get('/:id/resources', auth, userController.getUserResources);

// 獲取使用者下載歷史
router.get('/:id/downloads', auth, userController.getUserDownloads);

// 更新使用者個人資料
router.put('/:id/profile', auth, userController.updateProfile);

// 變更密碼
router.put('/:id/password', auth, userController.changePassword);

module.exports = router;