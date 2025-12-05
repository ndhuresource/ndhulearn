const nodemailer = require('nodemailer');
const { VerificationCode } = require('../models/associations');

// 👇 修改重點：Outlook 設定 + 強制 IPv4
const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  },
  tls: {
    ciphers: 'SSLv3',
    rejectUnauthorized: false
  },
  // 👇👇👇 絕對不能少這行！Render 救星 👇👇👇
  family: 4, 
  
  // 連線逾時設定
  connectionTimeout: 10000,
  greetingTimeout: 10000
});

const generateCode = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.sendVerificationEmail = async (email, username = '同學') => {
  try {
    console.log(`🚀 [Debug] (Outlook IPv4) 準備發信給: ${email}`);
    
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
        </div>
      `
    };

    // 3. 發送郵件
    console.log('📨 [Debug] 正在連線 Outlook SMTP...');
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ 驗證信發送成功! ID: ${info.messageId}`);
    return true;

  } catch (error) {
    console.error('❌ 發送郵件失敗:', error);
    throw error;
  }
};