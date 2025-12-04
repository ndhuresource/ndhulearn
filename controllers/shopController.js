const { ShopItem, User, UserPurchase, PointTransaction } = require('../models/associations');
const sequelize = require('../config/database');

const shopController = {
  // 1. 取得商品列表
  getItems: async (req, res) => {
    try {
      // 可篩選類型: ?type=頭貼 or ?type=外框
      const { type } = req.query; 
      const whereClause = { is_available: 1 };
      if (type) whereClause.item_type = type;

      const items = await ShopItem.findAll({ where: whereClause });
      res.json({ success: true, data: items });
    } catch (error) {
      res.status(500).json({ success: false, message: '讀取失敗' });
    }
  },

  // 2. 購買商品
  buyItem: async (req, res) => {
    const transaction = await sequelize.transaction();
    try {
      const userId = req.user.id;
      const { itemId } = req.body;

      // 檢查商品是否存在
      const item = await ShopItem.findByPk(itemId);
      if (!item || !item.is_available) {
        await transaction.rollback();
        return res.status(404).json({ success: false, message: '商品不存在或已下架' });
      }

      // 檢查是否已經購買過
      const existingPurchase = await UserPurchase.findOne({
        where: { user_id: userId, item_id: itemId }
      });
      if (existingPurchase) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: '你已經擁有此商品了' });
      }

      // 檢查餘額
      const user = await User.findByPk(userId, { transaction });
      if (user.current_points < item.price) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: '點數不足' });
      }

      // --- 開始扣款與發貨 ---

      // 1. 扣除點數
      user.current_points -= item.price;
      await user.save({ transaction });

      // 2. 建立購買紀錄
      await UserPurchase.create({
        user_id: userId,
        item_id: itemId
      }, { transaction });

      // 3. 建立交易紀錄
      await PointTransaction.create({
        user_id: userId,
        amount: -item.price, // 負數代表扣款
        transaction_type: '購買商品',
        description: `購買: ${item.item_name}`,
        balance_after: user.current_points
      }, { transaction });

      await transaction.commit();
      res.json({ success: true, message: `購買成功！剩下 ${user.current_points} 點` });

    } catch (error) {
      await transaction.rollback();
      res.status(500).json({ success: false, message: '購買失敗', error: error.message });
    }
  },

  // 3. 取得我的背包 (已購買商品)
  getMyInventory: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findByPk(userId, {
        include: [{
          model: ShopItem,
          as: 'inventory', // 在 associations.js 定義的多對多別名
          through: { attributes: [] } // 不顯示中間表資料
        }]
      });

      res.json({ success: true, data: user.inventory });
    } catch (error) {
      res.status(500).json({ success: false, message: '讀取失敗', error: error.message });
    }
  }
};

module.exports = shopController;