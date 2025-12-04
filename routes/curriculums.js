const express = require('express');
const router = express.Router();
const curriculumController = require('../controllers/curriculumController');
const auth = require('../middleware/auth');

// 獲取所有培養方案
router.get('/', curriculumController.getAllCurriculums);

// 根據科系獲取培養方案
router.get('/department/:departmentId', curriculumController.getCurriculumsByDepartment);

// 根據組別獲取培養方案
router.get('/group/:groupId', curriculumController.getCurriculumsByGroup);

// 根據學院獲取培養方案
router.get('/college/:collegeId', curriculumController.getCurriculumsByCollege);

// 獲取培養方案詳情
router.get('/:id', curriculumController.getCurriculum);

// 創建培養方案 (管理員功能)
router.post('/', auth, curriculumController.createCurriculum);

// 更新培養方案 (管理員功能)
router.put('/:id', auth, curriculumController.updateCurriculum);

// 刪除培養方案 (管理員功能)
router.delete('/:id', auth, curriculumController.deleteCurriculum);

module.exports = router;