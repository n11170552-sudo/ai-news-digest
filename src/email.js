const nodemailer = require('nodemailer');
const config = require('./config');
const { buildSubject } = require('./template');

const transporter = nodemailer.createTransport(config.email.smtp);

async function send(html, date) {
  try {
    const info = await transporter.sendMail({
      from: `AI News Digest <${config.email.from}>`,
      to: config.email.to,
      subject: buildSubject(date),
      html
    });
    console.log(`  Message sent: ${info.messageId}`);
  } catch (err) {
    console.error(`  Failed to send email: ${err.message}`);
    throw err;
  }
}

module.exports = { send };
