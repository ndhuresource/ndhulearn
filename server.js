const app = require('./app');
const sequelize = require('./config/database');
const { College } = require('./models'); // 導入 College 模型用於檢查數據

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`環境: ${NODE_ENV}`);

// 檢查必要的環境變量
const requiredEnvVars = ['DB_NAME', 'DB_USER', 'DB_HOST'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('缺少必要的環境變量:', missingEnvVars.join(', '));
  process.exit(1);
}

// 測試數據庫連接並啟動服務器
sequelize.authenticate()
  .then(async () => {
    console.log('數據庫連接成功');
    
    try {
      // 同步數據庫模型（根據環境使用不同的策略）
      if (NODE_ENV === 'development') {
        console.log('開發環境: 檢查數據庫狀態...');
        
        // 只驗證連接，不修改數據庫結構
        try {
          // 檢查數據庫中是否有數據
          const collegeCount = await College.count();
          console.log(`數據庫中有 ${collegeCount} 個學院記錄`);
          
          if (collegeCount === 0) {
            console.log('數據庫為空，請通過API或管理界面添加數據');
          }
          
          console.log('數據庫檢查完成，保持現有結構不變');
        } catch (error) {
          console.error('數據庫檢查失敗:', error);
          
          // 如果檢查失敗，可以考慮使用更保守的同步方式
          if (process.env.FORCE_SYNC === 'true') {
            console.warn('FORCE_SYNC=true, 嘗試安全同步數據庫...');
            await sequelize.sync({ alter: true });
            console.log('數據庫安全同步完成');
          }
        }
      } else if (NODE_ENV === 'test') {
        console.log('測試環境: 強制同步數據庫模型...');
        await sequelize.sync({ force: true });
        console.log('數據庫強制同步完成');
      } else {
        console.log('生產環境: 跳過自動數據庫同步');
        // 在生產環境中，應該使用遷移而不是自動同步
      }
      
      // 啟動服務器
      const server = app.listen(PORT, () => {
        console.log(`伺服器運行在端口 ${PORT}`);
      });
      
      // 優雅關閉處理
      const gracefulShutdown = async (signal) => {
        console.log(`收到 ${signal}, 開始關閉服務...`);
        
        server.close(async () => {
          console.log('HTTP服務已關閉');
          
          try {
            await sequelize.close();
            console.log('數據庫連接已關閉');
            process.exit(0);
          } catch (err) {
            console.error('關閉數據庫連接時出錯:', err);
            process.exit(1);
          }
        });
        
        // 如果關閉時間過長，強制退出
        setTimeout(() => {
          console.error('強制關閉服務');
          process.exit(1);
        }, 10000);
      };
      
      // 註冊信號處理
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));
      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      
    } catch (error) {
      console.error('服務器啟動失敗:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('數據庫連接失敗:', err);
    process.exit(1);
  });