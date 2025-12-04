const { Department, College, DepartmentGroup, Course, Curriculum } = require('../models/associations');
const { Op } = require('sequelize');

// 獲取所有科系
exports.getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name'], // 只返回需要的字段
      include: [
        {
          model: College,
          as: 'college',
          attributes: ['id', 'name']
        }
      ],
      order: [
        [{ model: College, as: 'college' }, 'name', 'ASC'],
        ['name', 'ASC']
      ]
    });

    // 转换为前端期望的简单格式
    const simplifiedDepartments = departments.map(dept => ({
      id: dept.id,
      name: dept.name,
      college: dept.college ? dept.college.name : ''
    }));

    res.json(simplifiedDepartments);
  } catch (error) {
    console.error('獲取科系列表錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 根據學院獲取科系
exports.getDepartmentsByCollege = async (req, res) => {
  try {
    const collegeId = req.params.collegeId;

    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ message: '學院不存在' });
    }

    const departments = await Department.findAll({
      where: { college_id: collegeId },
      attributes: ['id', 'name'],
      include: [
        {
          model: DepartmentGroup,
          as: 'groups',
          attributes: ['id', 'name']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(departments);
  } catch (error) {
    console.error('獲取學院科系列表錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取科系詳情
exports.getDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    const department = await Department.findByPk(departmentId, {
      include: [
        {
          model: College,
          as: 'college',
          attributes: ['id', 'name']
        },
        {
          model: DepartmentGroup,
          as: 'groups',
          attributes: ['id', 'name']
        },
        {
          model: Curriculum,
          include: [
            {
              model: Course,
              as: 'course',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!department) {
      return res.status(404).json({ message: '科系不存在' });
    }

    res.json(department);
  } catch (error) {
    console.error('獲取科系詳情錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 創建科系 (管理員功能)
exports.createDepartment = async (req, res) => {
  try {
    const { name, collegeId } = req.body;

    // 檢查學院是否存在
    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ message: '學院不存在' });
    }

    // 檢查科系是否已存在
    const existingDepartment = await Department.findOne({ 
      where: { name, college_id: collegeId } 
    });
    
    if (existingDepartment) {
      return res.status(400).json({ message: '科系名稱已存在' });
    }

    const department = await Department.create({ 
      name, 
      college_id: collegeId 
    });

    res.status(201).json({
      message: '科系創建成功',
      department
    });
  } catch (error) {
    console.error('創建科系錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 更新科系 (管理員功能)
exports.updateDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;
    const { name, collegeId } = req.body;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: '科系不存在' });
    }

    // 檢查學院是否存在
    if (collegeId) {
      const college = await College.findByPk(collegeId);
      if (!college) {
        return res.status(404).json({ message: '學院不存在' });
      }
    }

    // 檢查新名稱是否與其他科系衝突
    if (name && name !== department.name) {
      const existingDepartment = await Department.findOne({ 
        where: { name, college_id: collegeId || department.college_id } 
      });
      
      if (existingDepartment) {
        return res.status(400).json({ message: '科系名稱已存在' });
      }
    }

    await department.update({ 
      name: name || department.name,
      college_id: collegeId || department.college_id
    });

    res.json({
      message: '科系更新成功',
      department
    });
  } catch (error) {
    console.error('更新科系錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 刪除科系 (管理員功能)
exports.deleteDepartment = async (req, res) => {
  try {
    const departmentId = req.params.id;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: '科系不存在' });
    }

    await department.destroy();

    res.json({ message: '科系刪除成功' });
  } catch (error) {
    console.error('刪除科系錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};