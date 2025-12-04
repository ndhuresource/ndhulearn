const { ResourceRating, DownloadHistory, User, Resource } = require('../models/associations');
const sequelize = require('../config/database');

exports.createRating = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    // 1. 接收前端傳來的資料 (新增 isAnonymous)
    const { resourceId, completeness, accuracy, relevance, readability, credibility, comment, isAnonymous } = req.body;
    const userId = req.user.id;

    // 2. 檢查是否下載過 (關鍵權限檢查)
    const hasDownloaded = await DownloadHistory.findOne({
      where: { user_id: userId, resource_id: resourceId }
    });

    if (!hasDownloaded) {
      await transaction.rollback();
      return res.status(403).json({ message: '您必須先下載此資源才能進行評價' });
    }

    // 3. 檢查是否已經評價過
    const existingRating = await ResourceRating.findOne({
      where: { user_id: userId, resource_id: resourceId }
    });

    if (existingRating) {
      await transaction.rollback();
      return res.status(400).json({ message: '您已經評價過此資源了' });
    }

    // 4. 建立評價 (寫入 is_anonymous)
    const newRating = await ResourceRating.create({
      user_id: userId,
      resource_id: resourceId,
      completeness,
      accuracy,
      relevance,
      readability,
      credibility,
      comment,
      is_anonymous: isAnonymous || false // <--- 關鍵修改：存入匿名狀態
    }, { transaction });

    await transaction.commit();

    // 5. 回傳最新數據 (包含評論者資訊，讓前端可以直接更新列表)
    const ratingWithUser = await ResourceRating.findByPk(newRating.id, {
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar_url'] }]
    });

    res.status(201).json({ message: '評價成功', rating: ratingWithUser });

  } catch (error) {
    await transaction.rollback();
    console.error('評價失敗:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};

// 獲取某資源的所有評價
exports.getResourceRatings = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const ratings = await ResourceRating.findAll({
      where: { resource_id: resourceId },
      include: [{ model: User, as: 'user', attributes: ['id', 'username', 'avatar_url'] }],
      order: [['rating_time', 'DESC']]
    });
    res.json(ratings);
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
};

// 🔥 新增：刪除評價
exports.deleteRating = async (req, res) => {
  try {
    const { id } = req.params; // 評價 ID
    const userId = req.user.id;

    const rating = await ResourceRating.findByPk(id);

    if (!rating) {
      return res.status(404).json({ message: '評價不存在' });
    }

    // 權限檢查：只有評價者本人可以刪除
    if (rating.user_id !== userId) {
      return res.status(403).json({ message: '無權限刪除此評價' });
    }

    await rating.destroy();

    res.json({ message: '評價已刪除' });
  } catch (error) {
    console.error('刪除評價失敗:', error);
    res.status(500).json({ message: '伺服器錯誤', error: error.message });
  }
};