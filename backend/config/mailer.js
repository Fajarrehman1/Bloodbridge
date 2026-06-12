// config/mailer.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,    // your email
    pass: process.env.SMTP_PASS    // your app password
  }
});

const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"BloodBridge" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });
    
    console.log('📧 Email sent:', info.messageId);
    console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
  } catch (err) {
    console.error('❌ Email send error:', err);
    throw err;
  }
};

module.exports = { sendEmail };