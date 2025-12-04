const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const auth = require('../middleware/auth');

// 獲取所有科系
router.get('/', departmentController.getAllDepartments);

// 根據學院獲取科系
router.get('/college/:collegeId', departmentController.getDepartmentsByCollege);

// 獲取科系詳情
router.get('/:id', departmentController.getDepartment);

// 創建科系 (管理員功能)
router.post('/', auth, departmentController.createDepartment);

// 更新科系 (管理員功能)
router.put('/:id', auth, departmentController.updateDepartment);

// 刪除科系 (管理員功能)
router.delete('/:id', auth, departmentController.deleteDepartment);

module.exports = router;