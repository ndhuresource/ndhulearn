// models/associations.js

const College = require('./College');
const Department = require('./Department');
const DepartmentGroup = require('./DepartmentGroup');
const Course = require('./Course');
const Curriculum = require('./Curriculum');
const User = require('./User');
const Resource = require('./Resource');
const ResourceRating = require('./ResourceRating');
const VerificationCode = require('./VerificationCode');
const DownloadHistory = require('./DownloadHistory');

// 新增的 Models
const MarketplacePost = require('./MarketplacePost');
const MarketplaceComment = require('./MarketplaceComment');
const ForumPost = require('./ForumPost');
const ForumComment = require('./ForumComment');
const ForumLike = require('./ForumLike'); 
const DailyCheckin = require('./DailyCheckin');
const PointTransaction = require('./PointTransaction');
const ShopItem = require('./ShopItem');
const UserPurchase = require('./UserPurchase');
const PollOption = require('./PollOption');
const PollVote = require('./PollVote');

/**
 * 定義所有模型之間的關聯
 */
const defineAssociations = () => {
  // ==========================================
  // 1. 原有的資源版與學校結構關聯
  // ==========================================
  College.hasMany(Department, { foreignKey: 'college_id', as: 'departments' });
  Department.belongsTo(College, { foreignKey: 'college_id', as: 'college' });

  Department.hasMany(DepartmentGroup, { foreignKey: 'department_id', as: 'groups' });
  DepartmentGroup.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });

  Course.hasMany(Resource, { foreignKey: 'course_id', as: 'resources' });
  Resource.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

  User.hasMany(Resource, { foreignKey: 'uploader_id', as: 'uploadedResources' });
  Resource.belongsTo(User, { foreignKey: 'uploader_id', as: 'uploader' });

  User.hasMany(ResourceRating, { foreignKey: 'user_id', as: 'ratings' });
  ResourceRating.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Resource.hasMany(ResourceRating, { foreignKey: 'resource_id', as: 'resourceRatings' });
  ResourceRating.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });

  User.hasMany(DownloadHistory, { foreignKey: 'user_id', as: 'downloads' });
  DownloadHistory.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  Resource.hasMany(DownloadHistory, { foreignKey: 'resource_id', as: 'resourceDownloads' });
  DownloadHistory.belongsTo(Resource, { foreignKey: 'resource_id', as: 'resource' });

  Curriculum.belongsTo(College, { foreignKey: 'college_id', as: 'college' });
  Curriculum.belongsTo(Department, { foreignKey: 'department_id', as: 'department' });
  Curriculum.belongsTo(DepartmentGroup, { foreignKey: 'group_id', as: 'group' });
  Curriculum.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

  VerificationCode.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(VerificationCode, { foreignKey: 'user_id', as: 'verificationCodes' });

  College.hasMany(Curriculum, { foreignKey: 'college_id', as: 'curriculums' });
  Department.hasMany(Curriculum, { foreignKey: 'department_id', as: 'curriculums' });
  DepartmentGroup.hasMany(Curriculum, { foreignKey: 'group_id', as: 'curriculums' });
  Course.hasMany(Curriculum, { foreignKey: 'course_id', as: 'curriculums' });

  // ==========================================
  // 2. 買賣版關聯
  // ==========================================
  User.hasMany(MarketplacePost, { foreignKey: 'user_id' });
  MarketplacePost.belongsTo(User, { foreignKey: 'user_id' });

  MarketplacePost.hasMany(MarketplaceComment, { foreignKey: 'post_id', as: 'comments' });
  MarketplaceComment.belongsTo(MarketplacePost, { foreignKey: 'post_id', as: 'post' });

  User.hasMany(MarketplaceComment, { foreignKey: 'user_id', as: 'marketplaceComments' });
  MarketplaceComment.belongsTo(User, { foreignKey: 'user_id', as: 'commenter' });

  // ==========================================
  // 3. 聊天版 (論壇) 關聯
  // ==========================================
  User.hasMany(ForumPost, { foreignKey: 'user_id', as: 'forumPosts' });
  ForumPost.belongsTo(User, { foreignKey: 'user_id', as: 'author' });

  ForumPost.hasMany(ForumComment, { foreignKey: 'post_id', as: 'comments' });
  ForumComment.belongsTo(ForumPost, { foreignKey: 'post_id', as: 'post' });

  User.hasMany(ForumComment, { foreignKey: 'user_id', as: 'forumComments' });
  ForumComment.belongsTo(User, { foreignKey: 'user_id', as: 'commenter' });

  ForumPost.hasMany(PollOption, { foreignKey: 'post_id', as: 'pollOptions' });
  PollOption.belongsTo(ForumPost, { foreignKey: 'post_id' });

  PollOption.hasMany(PollVote, { foreignKey: 'option_id', as: 'votes' });
  PollVote.belongsTo(PollOption, { foreignKey: 'option_id' });

  User.hasMany(PollVote, { foreignKey: 'user_id' });
  PollVote.belongsTo(User, { foreignKey: 'user_id' });

  ForumPost.hasMany(ForumLike, { foreignKey: 'post_id', as: 'likes' });
  ForumLike.belongsTo(ForumPost, { foreignKey: 'post_id' });

  User.hasMany(ForumLike, { foreignKey: 'user_id', as: 'likedPosts' });
  ForumLike.belongsTo(User, { foreignKey: 'user_id' });

  // ==========================================
  // 4. 點數與商店關聯
  // ==========================================
  User.hasMany(DailyCheckin, { foreignKey: 'user_id', as: 'checkins' });
  DailyCheckin.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(PointTransaction, { foreignKey: 'user_id', as: 'pointTransactions' });
  PointTransaction.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  User.hasMany(UserPurchase, { foreignKey: 'user_id', as: 'purchases' });
  UserPurchase.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  ShopItem.hasMany(UserPurchase, { foreignKey: 'item_id', as: 'purchaseRecords' });
  UserPurchase.belongsTo(ShopItem, { foreignKey: 'item_id', as: 'item' });
  
  User.belongsToMany(ShopItem, { 
    through: UserPurchase, 
    foreignKey: 'user_id', 
    otherKey: 'item_id', 
    as: 'inventory' 
  });
  ShopItem.belongsToMany(User, { 
    through: UserPurchase, 
    foreignKey: 'item_id', 
    otherKey: 'user_id',
    as: 'owners'
  });

  // 個人裝備關聯
  // 1. 外框
  User.belongsTo(ShopItem, { foreignKey: 'avatar_frame_id', as: 'avatarFrame' });
  // 2. 徽章
  User.belongsTo(ShopItem, { foreignKey: 'badge_id', as: 'badge' });
  
  // 3. 主題
  // 🔥🔥🔥 修改重點：建議使用小寫 'theme' 作為別名，符合 JS 習慣 (例如 user.theme) 🔥🔥🔥
  // 雖然這段關聯在目前的 login 邏輯中沒有直接用到 (我們是用 ShopItem.findByPk)，
  // 但正確定義它對未來擴充 (如 getProfile) 很有幫助。
  User.belongsTo(ShopItem, { foreignKey: 'theme_id', as: 'theme' });
};

module.exports = {
  defineAssociations,
  College,
  Department,
  DepartmentGroup,
  Course,
  Curriculum,
  User,
  Resource,
  ResourceRating,
  VerificationCode,
  DownloadHistory,
  MarketplacePost,
  MarketplaceComment,
  ForumPost,
  ForumComment,
  ForumLike, 
  DailyCheckin,
  PointTransaction,
  ShopItem,
  UserPurchase,
  PollOption,
  PollVote
};