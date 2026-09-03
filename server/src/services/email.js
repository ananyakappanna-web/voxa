const nodemailer = require('nodemailer');

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const password = process.env.GMAIL_APP_PASSWORD;
  if (!user || !password) {
    throw new Error('Gmail SMTP is not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.');
  }

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: { user, pass: password.replace(/\s+/g, '') },
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 15000
  });
}

async function sendSignupOtp(email, otp) {
  await getTransporter().sendMail({
    from: `Voxa <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Your Voxa verification code',
    text: `Your Voxa verification code is ${otp}. It expires in 10 minutes.`,
    html: `<p>Your Voxa verification code is:</p><p style="font-size:28px;font-weight:700;letter-spacing:8px">${otp}</p><p>This code expires in 10 minutes. If you did not request it, you can ignore this email.</p>`
  });
}

module.exports = { sendSignupOtp };