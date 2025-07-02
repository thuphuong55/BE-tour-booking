const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function sendMail(to, subject, html) {
  const info = await transporter.sendMail({
    from: `"Booking Tour" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
  console.log("📧 Email sent:", info.messageId);
}

module.exports = sendMail;
