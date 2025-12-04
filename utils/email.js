const nodemailer = require('nodemailer');
const { VerificationCode } = require('../models/associations');

// 設定發信器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ndhu.resource.service@gmail.com', // 你的專用帳號
    pass: 'knybygrwuocmdsux'       // ⚠️ 記得換新的！
  }
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

// 修改：參數改成接收 email 和 username (因為註冊時還沒有 user 物件)
exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 1. 存入資料庫 (針對 Email 存驗證碼)
    // 先刪除該 Email 舊的驗證碼
    await VerificationCode.destroy({ where: { email: email } });
    
    await VerificationCode.create({
      user_id: null, // 註冊時還沒有 User ID，設為 null
      email: email,
      code: code,
      expires_at: expiresAt,
      is_used: 0
    });

    // 2. 設定信件內容
    const mailOptions = {
      // ⚠️ 修正重點：這裡的 <...> 裡面必須跟 auth.user 一模一樣
      from: '"東華學習資源平台" <ndhu.resource.service@gmail.com>', 
      to: email,
      subject: '【驗證碼】東華學習資源平台註冊驗證',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
          <h2 style="color: #1367c2;">歡迎加入東華學習資源平台！</h2>
          <p>親愛的同學 ${username} 您好：</p>
          <p>您的註冊驗證碼為：</p>
          <h1 style="color: #f57f17; letter-spacing: 5px;">${code}</h1>
          <p>此驗證碼將在 15 分鐘後失效。</p>
          <hr>
          <p style="font-size: 12px; color: #888;">此為系統自動發送，請勿直接回覆。</p>
        </div>
      `
    };

    // 3. 發送郵件
    await transporter.sendMail(mailOptions);
    console.log(`✅ 驗證信已發送至: ${email}`);
    return true;

  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    throw error;
  }
};