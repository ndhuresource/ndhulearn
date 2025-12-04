const { User, DailyCheckin, PointTransaction } = require('../models/associations');
const sequelize = require('../config/database'); // 需要用來做 Transaction
const moment = require('moment'); // 建議安裝 moment 或 dayjs 來處理時間，這裡示範用原生 Date

const pointController = {
  // 1. 每日簽到
  dailyCheckin: async (req, res) => {
    const transaction = await sequelize.transaction(); // 開啟事務
    try {
      const userId = req.user.id;
      const today = new Date().toISOString().split('T')[0]; // 取得 YYYY-MM-DD

      // 檢查是否已簽到
      const existingCheckin = await DailyCheckin.findOne({
        where: { user_id: userId, checkin_date: today }
      });

      if (existingCheckin) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: '今天已經簽到過了' });
      }

      const pointsEarned = 10; // 設定每日簽到獲得點數

      // 1. 建立簽到紀錄
      await DailyCheckin.create({
        user_id: userId,
        checkin_date: today,
        points_earned: pointsEarned
      }, { transaction });

      // 2. 更新使用者總點數
      const user = await User.findByPk(userId, { transaction });
      user.current_points += pointsEarned;
      user.total_checkins += 1;
      await user.save({ transaction });

      // 3. 建立交易紀錄
      await PointTransaction.create({
        user_id: userId,
        amount: pointsEarned,
        transaction_type: '簽到',
        description: `每日簽到 (${today})`,
        balance_after: user.current_points
      }, { transaction });

      await transaction.commit(); // 提交事務
      res.json({ success: true, message: `簽到成功！獲得 ${pointsEarned} 點`, current_points: user.current_points });

    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: '簽到失敗', error: error.message });
    }
  },

  // 2. 取得點數交易紀錄
  getHistory: async (req, res) => {
    try {
      const userId = req.user.id;
      const history = await PointTransaction.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        limit: 50 // 只顯示最近50筆
      });

      res.json({ success: true, data: history });
    } catch (error) {
      res.status(500).json({ success: false, message: '讀取失敗' });
    }
  }
};

module.exports = pointController;