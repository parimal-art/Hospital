const createTransporter = require('../config/mailer');

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || 'Clinic ERP <no-reply@clinic.local>';

  if (!transporter) {
    console.log('Email transporter not configured. Development email preview:');
    console.log({ to, from, subject, text, html });
    return { preview: true };
  }

  return transporter.sendMail({ from, to, subject, html, text });
};

module.exports = sendEmail;
