// controllers/courseController.js

// 🔥 1. 確保這裡引入了 ShopItem 和 DownloadHistory (用於判斷下載狀態)
const { Course, Curriculum, Department, DepartmentGroup, College, Resource, ResourceRating, User, ShopItem, DownloadHistory } = require('../models/associations');
const { Op, Sequelize } = require('sequelize');
const sequelize = require('../config/database');

// 獲取所有課程 (保持你原本的複雜排序邏輯不變)
exports.getAllCourses = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, department, group, course_level, course_type, sort } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { id: { [Op.like]: `%${search}%` } },
        { name: { [Op.like]: `%${search}%` } }
      ];
    }
    if (course_level) whereClause.course_level = course_level;

    let curriculumWhere = {};
    if (department) curriculumWhere.department_id = department;
    if (group) curriculumWhere.group_id = group;
    if (course_type) curriculumWhere.type = course_type;

    let orderClause = [];
    switch (sort) {
      case 'notes_desc':
        orderClause = [[sequelize.literal('(SELECT COUNT(*) FROM resources WHERE resources.course_id = Course.id)'), 'DESC']];
        break;
      case 'notes_asc':
        orderClause = [[sequelize.literal('(SELECT COUNT(*) FROM resources WHERE resources.course_id = Course.id)'), 'ASC']];
        break;
      case 'reviews_desc':
        orderClause = [[sequelize.literal('(SELECT COUNT(*) FROM resource_ratings JOIN resources ON resource_ratings.resource_id = resources.id WHERE resources.course_id = Course.id)'), 'DESC']];
        break;
      case 'reviews_asc':
        orderClause = [[sequelize.literal('(SELECT COUNT(*) FROM resource_ratings JOIN resources ON resource_ratings.resource_id = resources.id WHERE resources.course_id = Course.id)'), 'ASC']];
        break;
      case 'new':
        orderClause = [['id', 'DESC']]; 
        break;
      default:
        orderClause = [['name', 'ASC']];
    }

    const { count, rows: courses } = await Course.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Curriculum,
          as: 'curriculums',
          where: Object.keys(curriculumWhere).length > 0 ? curriculumWhere : undefined,
          required: !!(department || group || course_type),
          include: [
            { model: Department, as: 'department', attributes: ['id', 'name'] },
            { model: DepartmentGroup, as: 'group', attributes: ['id', 'name'] }
          ]
        },
        {
          model: Resource,
          as: 'resources',
          attributes: ['id', 'teacher'],
        }
      ],
      order: orderClause,
      subQuery: false,
      distinct: true,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const processedCourses = await Promise.all(
      courses.map(async (course) => {
        const noteCount = await Resource.count({ where: { course_id: course.id } });
        const reviewCount = await ResourceRating.count({
          include: [{ model: Resource, as: 'resource', where: { course_id: course.id } }]
        });

        const teachers = [...new Set(course.resources.map(r => r.teacher).filter(t => t))];
        const curr = course.curriculums[0];
        
        return {
          id: course.id,
          name: course.name,
          course_level: course.course_level,
          type: curr ? curr.type : '未知',
          departmentName: curr?.department?.name || '通識/其他',
          groupName: curr?.group?.name || null,
          teachers: teachers,
          createdAt: course.created_at || new Date(), 
          noteCount,
          reviewCount
        };
      })
    );

    res.json({
      courses: processedCourses,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page)
    });

  } catch (error) {
    console.error('獲取課程列表錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 🔥🔥🔥 修正後的 getCourse (包含上傳者和評價者的外框/徽章) 🔥🔥🔥
exports.getCourse = async (req, res) => {
    try {
      const courseId = req.params.id;
      // 嘗試從 request 中獲取 user (如果有 auth 中間件的話)
      const userId = req.user ? req.user.id : null;

      const course = await Course.findByPk(courseId, {
        include: [
          {
            model: Curriculum,
            as: 'curriculums',
            include: [
              { model: Department, as: 'department', attributes: ['id', 'name'], include: [{ model: College, as: 'college', attributes: ['id', 'name'] }] },
              { model: DepartmentGroup, as: 'group', attributes: ['id', 'name'] }
            ]
          },
          {
            model: Resource, as: 'resources',
            include: [
              // 1. 上傳者資料 (原本已修正，這裡保持不變)
              { 
                model: User, 
                as: 'uploader', 
                attributes: ['id', 'username', 'avatar_url', 'avatar_frame_id', 'badge_id'],
                include: [
                  { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
                  { model: ShopItem, as: 'badge', attributes: ['item_url'] }
                ]
              },
              // 🔥 2. 評價者資料 (這次的重點修正！)
              { 
                model: ResourceRating, 
                as: 'resourceRatings', 
                include: [{ 
                  model: User, 
                  as: 'user', 
                  // ✅ 關鍵：補上這兩個 ID 和關聯，前端才能顯示評價者的外框徽章
                  attributes: ['id', 'username', 'avatar_url', 'avatar_frame_id', 'badge_id'],
                  include: [
                    { model: ShopItem, as: 'avatarFrame', attributes: ['item_url'] },
                    { model: ShopItem, as: 'badge', attributes: ['item_url'] }
                  ]
                }] 
              },
              // 3. 下載紀錄 (用於判斷是否已下載，解決你的評價權限問題)
              {
                model: DownloadHistory,
                as: 'resourceDownloads', // 請確認你的 association.js 是用這個 alias (若無 alias 則刪除這行)
                required: false,
                where: userId ? { user_id: userId } : { user_id: 0 }
              }
            ]
          }
        ]
      });

      if (!course) return res.status(404).json({ message: '課程不存在' });

      // 加工資料：加上 hasDownloaded 旗標
      const courseData = course.toJSON();
      courseData.resources = courseData.resources.map(res => {
        return {
          ...res,
          hasDownloaded: res.resourceDownloads && res.resourceDownloads.length > 0
        };
      });

      res.json(courseData);
    } catch (error) {
      console.error('獲取課程詳情錯誤:', error);
      res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
};

exports.createCourse = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { id, name, courseLevel, departmentId, groupId, type } = req.body;
    const existingCourse = await Course.findByPk(id);
    if (existingCourse) { await transaction.rollback(); return res.status(400).json({ message: '課程代碼已存在' }); }
    const course = await Course.create({ id, name, course_level: courseLevel }, { transaction });
    const department = await Department.findByPk(departmentId);
    if (!department) { await transaction.rollback(); return res.status(404).json({ message: '找不到該科系' }); }
    await Curriculum.create({ course_id: id, department_id: departmentId, college_id: department.college_id, type: type || '必修', group_id: groupId || null }, { transaction });
    await transaction.commit();
    res.status(201).json({ message: '課程創建成功', course });
  } catch (error) {
    await transaction.rollback();
    console.error('創建課程錯誤:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

exports.updateCourse = async (req, res) => {
    try {
      const courseId = req.params.id;
      const { name, courseLevel } = req.body;
      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ message: '課程不存在' });
      await course.update({ name: name || course.name, course_level: courseLevel || course.course_level });
      res.json({ message: '課程更新成功', course });
    } catch (error) {
      res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
};

exports.deleteCourse = async (req, res) => {
    try {
      const courseId = req.params.id;
      const course = await Course.findByPk(courseId);
      if (!course) return res.status(404).json({ message: '課程不存在' });
      await course.destroy();
      res.json({ message: '課程刪除成功' });
    } catch (error) {
      res.status(500).json({ message: '伺服器錯誤', error: error.message });
    }
};