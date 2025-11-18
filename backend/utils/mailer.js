const nodemailer = require('nodemailer');
require('dotenv').config();

// This mailer requires real SMTP credentials. Ethereal/test fallback removed to ensure
// real-time mails go to real student inboxes.

let transporter = null;

async function initTransporter() {
  // Require real SMTP credentials (Gmail recommended via EMAIL_USER / EMAIL_PASS)
  // We'll use nodemailer's 'gmail' service when EMAIL_USER/EMAIL_PASS are provided.
  const emailUser = (process.env.EMAIL_USER || process.env.MAIL_USER || '').trim() || null;
  const emailPass = (process.env.EMAIL_PASS || process.env.MAIL_PASS || '').trim() || null;

  if (!emailUser || !emailPass) {
    console.error('❌ Missing EMAIL_USER or EMAIL_PASS environment variables. Real SMTP is required (no Ethereal fallback).');
    console.error('Please set EMAIL_USER and EMAIL_PASS (Gmail app password recommended) and restart the server.');
    // Exit to avoid running without real email capability
    process.exit(1);
  }

  // Use Gmail service by default for simplicity; this accepts app passwords for accounts with 2FA.
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass
    }
  });

  try {
    await transporter.verify();
    console.log('✅ Mail transporter verified (Gmail SMTP). Ready to send emails.');
  } catch (err) {
    console.error('❌ Mail transporter verification failed (Gmail):', err?.message || err);
    console.error('Please verify EMAIL_USER/EMAIL_PASS and network access to SMTP. Exiting.');
    process.exit(1);
  }






}

// Initialize transporter at startup
initTransporter();

async function sendMail({ to, subject, html, text }) {
  if (!transporter) {
    console.error('❌ No mail transporter initialized. Email not sent to', to);
    return { success: false, error: 'No transporter configured' };
  }

  const fromAddress = (process.env.MAIL_FROM || process.env.EMAIL_FROM || `${process.env.EMAIL_USER || process.env.MAIL_USER || ''}`).trim();

  const mailOptions = {
    from: fromAddress,
    to,
    subject
  };
  if (text) mailOptions.text = text;
  if (html) mailOptions.html = html;

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email sent to ${to}: ${info.messageId || 'unknown-id'}`);
    return { success: true, info };
  } catch (err) {
    console.error(`❌ Failed to send email to ${to}:`, err?.message || err);
    return { success: false, error: err?.message || err };
  }
}

module.exports = { sendMail, initTransporter };
