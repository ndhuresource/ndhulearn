const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');
const rateLimit = require('express-rate-limit');

// 加載環境變量
dotenv.config();

const app = express();

// ==========================================
// 🚨 關鍵修正區域 (針對 Render 部署優化)
// ==========================================

// 1. 信任 Render 的負載平衡器 (解決 Rate Limit 報錯)
app.set('trust proxy', 1);

// 2. 健康檢查路由 (解決 Render 自動重啟問題)
// ⚠️ 必須放在所有中間件的最前面，確保機器人檢查時暢通無阻
app.get('/', (req, res) => {
  res.status(200).send('Backend is alive! (NDHU Resource Platform)');
});

// ==========================================

// 從環境變量獲取允許的來源
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim()) 
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174'];

// 確保允許的來源清單中包含本地開發用的來源
if (process.env.NODE_ENV === 'development') {
    if (!allowedOrigins.includes('http://localhost:3000')) allowedOrigins.push('http://localhost:3000');
    if (!allowedOrigins.includes('http://localhost:5173')) allowedOrigins.push('http://localhost:5173');
}

console.log('Allowed origins:', allowedOrigins);

const isDevelopment = process.env.NODE_ENV === 'development';

// ==========================================
// 速率限制配置 
// ==========================================

// 1. 全局限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 1000, 
  message: '請求過於頻繁，請稍後再試',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// 2. 一般 API 限制
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 2000 : 1000, 
  message: 'API請求過於頻繁，請稍後再試',
});
app.use('/api/', apiLimiter);

// 3. 認證相關限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: '認證請求過於頻繁，請稍後再試',
});
app.use('/api/auth', authLimiter);

// ==========================================

// 中間件
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 這裡我們將完整的 corsOptions 提取出來，以便重複使用
const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked request from: ${origin}`);
            if (isDevelopment) {
                console.log(`Development mode: allowing origin ${origin}`);
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'], 
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

// CORS 配置 (應用於所有請求)
app.use(cors(corsOptions));

// 🔥 關鍵修正：明確處理所有路由的 OPTIONS 預檢請求，並應用完整的 corsOptions
// 確保預檢成功是解決 net::ERR_... 失敗的關鍵步驟
app.options('*', cors(corsOptions));

app.use(morgan(isDevelopment ? 'dev' : 'combined'));

app.use((req, res, next) => {
  // 忽略健康檢查的 log，避免洗版
  if (req.url !== '/') {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const staticOptions = {
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : '0',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
};

// 檔案服務端點
app.use('/media', express.static('media', staticOptions));
app.use('/uploads', express.static('uploads', staticOptions));

// 數據庫連接
const db = require('./config/database');

// 注意：這裡只做 authenticate 檢查，不要在這裡做 sync，避免邏輯混亂
db.authenticate()
  .then(() => console.log('數據庫連接成功'))
  .catch(err => {
    console.error('數據庫連接失敗:', err);
    if (process.env.NODE_ENV === 'production') {
      // 在生產環境如果連不上資料庫，讓 PM2/Render 重啟服務是比較安全的做法
      // 但如果只是短暫斷線，不想殺掉服務，可以註解掉下面這行
      // process.exit(1);
    }
  });

// 加載模型關聯
const { defineAssociations } = require('./models/associations');
defineAssociations();
console.log('模型關聯已加載');

// API 內部詳細健康檢查 (Health Check API)
app.get('/health', async (req, res) => {
  try {
    await db.authenticate();
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// ==========================================
// API 路由 
// ==========================================

// 1. 原有的路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/colleges', require('./routes/colleges'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/groups', require('./routes/departmentgroups'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/curriculums', require('./routes/curriculums'));
app.use('/api/resources', require('./routes/resources'));
app.use('/api/ratings', require('./routes/ratings'));

// 2. 新增的路由
app.use('/api/marketplace', require('./routes/marketplace'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/points', require('./routes/points'));
app.use('/api/shop', require('./routes/shop'));

// 用戶與個人資料路由
app.use('/api/users', require('./routes/users')); 
app.use('/api/profile', require('./routes/userProfile')); 

// ==========================================

// API 文檔端點
app.get('/api', (req, res) => {
  res.json({
    message: '東華大學學習資源平台 API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      colleges: '/api/colleges',
      // ... (省略部分，維持原樣)
      profile: '/api/profile'
    }
  });
});

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('錯誤詳情:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    body: req.body
  });
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ message: '文件大小超過限制', maxSize: '10MB' });
  }
  
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({ message: '不支持的文件類型' });
  }
  
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
    return res.status(400).json({ message: '數據驗證失敗', errors });
  }
  
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ message: '數據已存在', field: err.errors[0].path });
  }
  
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: '無效的令牌' });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: '令牌已過期' });
  }
  
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ 
      message: '跨域請求被拒絕',
      allowedOrigins: allowedOrigins
    });
  }
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' && statusCode === 500 
    ? '伺服器內部錯誤' 
    : err.message;
  
  res.status(statusCode).json({ 
    message,
    ...(process.env.NODE_ENV !== 'production' && { error: err.message, stack: err.stack })
  });
});

app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API端點不存在' });
});

app.use('*', (req, res) => {
  if (req.accepts('html')) {
    res.status(404).send('頁面不存在');
  } else {
    res.status(404).json({ message: '資源不存在' });
  }
});

module.exports = app;