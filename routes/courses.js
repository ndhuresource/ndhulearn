// routes/courses.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const auth = require('../middleware/auth');

// 獲取所有課程（包含搜索功能）
router.get('/', courseController.getAllCourses);

// 獲取課程詳情
router.get('/:id', courseController.getCourse);

// 創建課程
router.post('/', auth, courseController.createCourse);

// 更新課程
router.put('/:id', auth, courseController.updateCourse);

// 刪除課程
router.delete('/:id', auth, courseController.deleteCourse);

module.exports = router;