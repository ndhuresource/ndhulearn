const { College, Department, DepartmentGroup, Course, Curriculum } = require('../models/associations');
const { Op } = require('sequelize');

// 獲取所有學院及其科系
exports.getAllColleges = async (req, res) => {
  try {
    const colleges = await College.findAll({
      include: [
        {
          model: Department,
          as: 'departments',
          include: [
            {
              model: DepartmentGroup,
              as: 'groups',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [
        ['name', 'ASC'],
        [{ model: Department, as: 'departments' }, 'name', 'ASC'],
        [{ model: Department, as: 'departments' }, { model: DepartmentGroup, as: 'groups' }, 'name', 'ASC']
      ]
    });

    res.json(colleges);
  } catch (error) {
    console.error('獲取學院列表錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取單個學院詳情
exports.getCollege = async (req, res) => {
  try {
    const collegeId = req.params.id;

    const college = await College.findByPk(collegeId, {
      include: [
        {
          model: Department,
          as: 'departments',
          include: [
            {
              model: DepartmentGroup,
              as: 'groups',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!college) {
      return res.status(404).json({ message: '學院不存在' });
    }

    res.json(college);
  } catch (error) {
    console.error('獲取學院詳情錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 創建學院 (管理員功能)
exports.createCollege = async (req, res) => {
  try {
    const { name } = req.body;

    // 檢查學院是否已存在
    const existingCollege = await College.findOne({ where: { name } });
    if (existingCollege) {
      return res.status(400).json({ message: '學院名稱已存在' });
    }

    const college = await College.create({ name });

    res.status(201).json({
      message: '學院創建成功',
      college
    });
  } catch (error) {
    console.error('創建學院錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 更新學院 (管理員功能)
exports.updateCollege = async (req, res) => {
  try {
    const collegeId = req.params.id;
    const { name } = req.body;

    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ message: '學院不存在' });
    }

    // 檢查新名稱是否與其他學院衝突
    if (name !== college.name) {
      const existingCollege = await College.findOne({ where: { name } });
      if (existingCollege) {
        return res.status(400).json({ message: '學院名稱已存在' });
      }
    }

    await college.update({ name }); // 注意：如果出錯，嘗試改成 college.name = name; await college.save();

    res.json({
      message: '學院更新成功',
      college
    });
  } catch (error) {
    console.error('更新學院錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 刪除學院 (管理員功能)
exports.deleteCollege = async (req, res) => {
  try {
    const collegeId = req.params.id;

    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ message: '學院不存在' });
    }

    await college.destroy();

    res.json({ message: '學院刪除成功' });
  } catch (error) {
    console.error('刪除學院錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};