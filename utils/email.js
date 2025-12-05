const nodemailer = require('nodemailer');
const { VerificationCode } = require('../models/associations');

// 設定發信器
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    // 👇 修改這裡：改成讀取環境變數，不要直接寫死
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // 1. 存入資料庫
    await VerificationCode.destroy({ where: { email: email } });
    
    await VerificationCode.create({
      user_id: null,
      email: email,
      code: code,
      expires_at: expiresAt,
      is_used: 0
    });

    // 2. 設定信件內容
    const mailOptions = {
      // 👇 修改這裡：寄件人地址也要用環境變數，確保一致
      from: `"東華學習資源平台" <${process.env.EMAIL_USER}>`, 
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