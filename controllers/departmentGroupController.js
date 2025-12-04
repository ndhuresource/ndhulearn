const { DepartmentGroup, Department, College, Curriculum, Course } = require('../models/associations'); // 添加 Curriculum 和 Course 導入
const { Op } = require('sequelize');

// 根據科系獲取組別
exports.getGroupsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: '科系不存在' });
    }

    const groups = await DepartmentGroup.findAll({
      where: { department_id: departmentId },
      include: [
        {
          model: Department,
          as: 'department', // 使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json(groups);
  } catch (error) {
    console.error('獲取科系組別列表錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取組別詳情
exports.getGroup = async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await DepartmentGroup.findByPk(groupId, {
      include: [
        {
          model: Department,
          as: 'department', // 使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!group) {
      return res.status(404).json({ message: '組別不存在' });
    }

    res.json(group);
  } catch (error) {
    console.error('獲取組別詳情錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 創建組別
exports.createGroup = async (req, res) => {
  try {
    const { name, department_id } = req.body;

    // 檢查是否已存在相同名稱的組別（在同一科系下）
    const existingGroup = await DepartmentGroup.findOne({
      where: {
        name,
        department_id
      }
    });

    if (existingGroup) {
      return res.status(409).json({ message: '該科系下已存在同名組別' });
    }

    const group = await DepartmentGroup.create({
      name,
      department_id
    });

    res.status(201).json(group);
  } catch (error) {
    console.error('創建組別錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 更新組別
exports.updateGroup = async (req, res) => {
  try {
    const groupId = req.params.id;
    const { name, department_id } = req.body;

    const group = await DepartmentGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: '組別不存在' });
    }

    // 檢查是否已存在相同名稱的組別（在同一科系下）
    const existingGroup = await DepartmentGroup.findOne({
      where: {
        name,
        department_id,
        id: { [Op.ne]: groupId } // 排除當前組別
      }
    });

    if (existingGroup) {
      return res.status(409).json({ message: '該科系下已存在同名組別' });
    }

    await group.update({
      name,
      department_id
    });

    res.json(group);
  } catch (error) {
    console.error('更新組別錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 刪除組別
exports.deleteGroup = async (req, res) => {
  try {
    const groupId = req.params.id;

    const group = await DepartmentGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: '組別不存在' });
    }

    // 檢查是否有課程關聯到此組別
    const curriculumCount = await Curriculum.count({
      where: { group_id: groupId }
    });

    if (curriculumCount > 0) {
      return res.status(409).json({ 
        message: '無法刪除組別，因為有課程關聯到此組別' 
      });
    }

    await group.destroy();
    res.json({ message: '組別已刪除' });
  } catch (error) {
    console.error('刪除組別錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};