const express = require('express');
const router = express.Router();
const downloadController = require('../controllers/downloadController');
const auth = require('../middleware/auth');

// 記錄下載
router.post('/', auth, downloadController.recordDownload);

// 獲取下載歷史統計
router.get('/stats', auth, downloadController.getDownloadStats);

module.exports = router;