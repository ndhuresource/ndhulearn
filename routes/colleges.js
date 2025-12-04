const express = require('express');
const router = express.Router();
const collegeController = require('../controllers/collegeController');

// 重要修改：不要用解構賦值 { auth }，直接引入
const auth = require('../middleware/auth');

// 獲取所有學院及其科系
router.get('/', collegeController.getAllColleges);

// 獲取單個學院詳情
router.get('/:id', collegeController.getCollege);

// 創建學院 (管理員功能)
router.post('/', auth, collegeController.createCollege);

// 更新學院 (管理員功能)
router.put('/:id', auth, collegeController.updateCollege);

// 刪除學院 (管理員功能)
router.delete('/:id', auth, collegeController.deleteCollege);

module.exports = router;