const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config();

// 👇👇👇 偵錯間諜：印出目前的變數狀態 (Debug Logs) 👇👇👇
console.log('🔍 [Cloudinary Config Check]');
console.log('   - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ 有讀到' : '❌ 未定義');
console.log('   - API Key:', process.env.CLOUDINARY_API_KEY ? '✅ 有讀到' : '❌ 未定義');
console.log('   - API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ 有讀到' : '❌ 未定義');

// 1. 嚴格檢查
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('🚨 嚴重錯誤: Cloudinary 環境變數缺失！後端可能會崩潰。');
}

// 2. 設定 Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// 3. 設定儲存引擎
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    try {
      console.log('📂 準備上傳檔案:', file.originalname);
      const fileName = file.originalname.split('.')[0];
      return {
        folder: 'ndhu-resources',
        resource_type: 'auto',
        public_id: `${Date.now()}-${fileName}`,
      };
    } catch (err) {
      console.error('❌ Cloudinary Storage Error:', err);
      throw err;
    }
  },
});

const upload = multer({ storage: storage });

module.exports = upload;