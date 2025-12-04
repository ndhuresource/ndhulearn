const express = require('express');
const router = express.Router();
const departmentGroupController = require('../controllers/departmentGroupController');
const auth = require('../middleware/auth');

// 根據科系獲取組別
router.get('/department/:departmentId', departmentGroupController.getGroupsByDepartment);

// 獲取組別詳情
router.get('/:id', departmentGroupController.getGroup);

// 創建組別 (管理員功能)
router.post('/', auth, departmentGroupController.createGroup);

// 更新組別 (管理員功能)
router.put('/:id', auth, departmentGroupController.updateGroup);

// 刪除組別 (管理員功能)
router.delete('/:id', auth, departmentGroupController.deleteGroup);

module.exports = router;