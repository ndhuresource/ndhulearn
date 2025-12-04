const { Curriculum, Course, Department, College, DepartmentGroup } = require('../models/associations');
const { Op } = require('sequelize');

// 獲取所有培養方案
exports.getAllCurriculums = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const curriculums = await Curriculum.findAndCountAll({
      include: [
        {
          model: Course,
          as: 'course', // 添加這行，使用正確的別名
          attributes: ['id', 'name', 'course_level']
        },
        {
          model: Department,
          as: 'department', // 添加這行，使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 添加這行，使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: DepartmentGroup,
          as: 'group', // 添加這行，使用正確的別名
          attributes: ['id', 'name']
        }
      ],
      order: [
        [{ model: Department, as: 'department' }, { model: College, as: 'college' }, 'name', 'ASC'], // 修正排序
        [{ model: Department, as: 'department' }, 'name', 'ASC'],
        ['type', 'ASC']
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      curriculums: curriculums.rows,
      totalCount: curriculums.count,
      totalPages: Math.ceil(curriculums.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('獲取培養方案列表錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 根據科系獲取培養方案
exports.getCurriculumsByDepartment = async (req, res) => {
  try {
    const departmentId = req.params.departmentId;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: '科系不存在' });
    }

    let whereClause = { department_id: departmentId };
    if (type) whereClause.type = type;

    const curriculums = await Curriculum.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course', // 添加這行，使用正確的別名
          attributes: ['id', 'name', 'course_level']
        },
        {
          model: Department,
          as: 'department', // 添加這行，使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 添加這行，使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: DepartmentGroup,
          as: 'group', // 添加這行，使用正確的別名
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['type', 'ASC'],
        [{ model: Course, as: 'course' }, 'id', 'ASC'] // 修正排序
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      curriculums: curriculums.rows,
      totalCount: curriculums.count,
      totalPages: Math.ceil(curriculums.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('獲取科系培養方案錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 根據組別獲取培養方案
exports.getCurriculumsByGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const group = await DepartmentGroup.findByPk(groupId);
    if (!group) {
      return res.status(404).json({ message: '組別不存在' });
    }

    let whereClause = { group_id: groupId };
    if (type) whereClause.type = type;

    const curriculums = await Curriculum.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course', // 添加這行，使用正確的別名
          attributes: ['id', 'name', 'course_level']
        },
        {
          model: Department,
          as: 'department', // 添加這行，使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 添加這行，使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: DepartmentGroup,
          as: 'group', // 添加這行，使用正確的別名
          attributes: ['id', 'name']
        }
      ],
      order: [
        ['type', 'ASC'],
        [{ model: Course, as: 'course' }, 'id', 'ASC'] // 修正排序
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      curriculums: curriculums.rows,
      totalCount: curriculums.count,
      totalPages: Math.ceil(curriculums.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('獲取組別培養方案錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 根據學院獲取培養方案
exports.getCurriculumsByCollege = async (req, res) => {
  try {
    const collegeId = req.params.collegeId;
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const college = await College.findByPk(collegeId);
    if (!college) {
      return res.status(404).json({ message: '學院不存在' });
    }

    let whereClause = { college_id: collegeId };
    if (type) whereClause.type = type;

    const curriculums = await Curriculum.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Course,
          as: 'course', // 添加這行，使用正確的別名
          attributes: ['id', 'name', 'course_level']
        },
        {
          model: Department,
          as: 'department', // 添加這行，使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 添加這行，使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: DepartmentGroup,
          as: 'group', // 添加這行，使用正確的別名
          attributes: ['id', 'name']
        }
      ],
      order: [
        [{ model: Department, as: 'department' }, 'name', 'ASC'], // 修正排序
        ['type', 'ASC'],
        [{ model: Course, as: 'course' }, 'id', 'ASC'] // 修正排序
      ],
      limit: parseInt(limit),
      offset: offset
    });

    res.json({
      curriculums: curriculums.rows,
      totalCount: curriculums.count,
      totalPages: Math.ceil(curriculums.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('獲取學院培養方案錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取培養方案詳情
exports.getCurriculum = async (req, res) => {
  try {
    const curriculumId = req.params.id;

    const curriculum = await Curriculum.findByPk(curriculumId, {
      include: [
        {
          model: Course,
          as: 'course', // 添加這行，使用正確的別名
          attributes: ['id', 'name', 'course_level']
        },
        {
          model: Department,
          as: 'department', // 添加這行，使用正確的別名
          attributes: ['id', 'name'],
          include: [
            {
              model: College,
              as: 'college', // 添加這行，使用正確的別名
              attributes: ['id', 'name']
            }
          ]
        },
        {
          model: DepartmentGroup,
          as: 'group', // 添加這行，使用正確的別名
          attributes: ['id', 'name']
        }
      ]
    });

    if (!curriculum) {
      return res.status(404).json({ message: '培養方案不存在' });
    }

    res.json(curriculum);
  } catch (error) {
    console.error('獲取培養方案詳情錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 創建培養方案
exports.createCurriculum = async (req, res) => {
  try {
    const { course_id, department_id, college_id, group_id, type } = req.body;

    // 檢查是否已存在相同的培養方案
    const existingCurriculum = await Curriculum.findOne({
      where: {
        course_id,
        department_id,
        group_id: group_id || null
      }
    });

    if (existingCurriculum) {
      return res.status(409).json({ message: '培養方案已存在' });
    }

    const curriculum = await Curriculum.create({
      course_id,
      department_id,
      college_id,
      group_id,
      type
    });

    res.status(201).json(curriculum);
  } catch (error) {
    console.error('創建培養方案錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 更新培養方案
exports.updateCurriculum = async (req, res) => {
  try {
    const curriculumId = req.params.id;
    const { course_id, department_id, college_id, group_id, type } = req.body;

    const curriculum = await Curriculum.findByPk(curriculumId);
    if (!curriculum) {
      return res.status(404).json({ message: '培養方案不存在' });
    }

    // 檢查是否已存在相同的培養方案（排除當前培養方案）
    const existingCurriculum = await Curriculum.findOne({
      where: {
        course_id,
        department_id,
        group_id: group_id || null,
        id: { [Op.ne]: curriculumId }
      }
    });

    if (existingCurriculum) {
      return res.status(409).json({ message: '培養方案已存在' });
    }

    await curriculum.update({
      course_id,
      department_id,
      college_id,
      group_id,
      type
    });

    res.json(curriculum);
  } catch (error) {
    console.error('更新培養方案錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 刪除培養方案
exports.deleteCurriculum = async (req, res) => {
  try {
    const curriculumId = req.params.id;

    const curriculum = await Curriculum.findByPk(curriculumId);
    if (!curriculum) {
      return res.status(404).json({ message: '培養方案不存在' });
    }

    await curriculum.destroy();
    res.json({ message: '培養方案已刪除' });
  } catch (error) {
    console.error('刪除培養方案錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};