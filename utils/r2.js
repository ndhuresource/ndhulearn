const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// 配置 AWS SDK 使用 Cloudflare R2
const s3 = new AWS.S3({
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.R2_ACCESS_KEY_ID,
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  signatureVersion: 'v4',
  region: 'auto' // R2 要求 region 设置为 'auto'
});

// 上傳文件到 R2
exports.uploadFile = async (file, folder = 'resources') => {
  try {
    const fileExtension = file.originalname.split('.').pop();
    const key = `${folder}/${uuidv4()}.${fileExtension}`;
    
    const params = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      // R2 不支持 ACL，所以移除這行
      // ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    
    // 構建公共訪問 URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${result.Key}`;
    
    return {
      key: result.Key,
      location: result.Location,
      bucket: result.Bucket,
      publicUrl: publicUrl
    };
  } catch (error) {
    console.error('R2 上傳錯誤:', error);
    throw new Error('文件上傳失敗');
  }
};

// 從 R2 獲取文件
exports.getFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    };

    return await s3.getObject(params).promise();
  } catch (error) {
    console.error('R2 獲取文件錯誤:', error);
    throw new Error('文件獲取失敗');
  }
};

// 從 R2 刪除文件
exports.deleteFile = async (key) => {
  try {
    const params = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('R2 刪除文件錯誤:', error);
    throw new Error('文件刪除失敗');
  }
};

// 生成預簽名 URL（用於臨時訪問文件）
exports.generatePresignedUrl = async (key, expires = 3600) => {
  try {
    const params = {
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Expires: expires // 鏈接有效期（秒）
    };

    return await s3.getSignedUrlPromise('getObject', params);
  } catch (error) {
    console.error('生成預簽名 URL 錯誤:', error);
    throw new Error('生成下載鏈接失敗');
  }
};