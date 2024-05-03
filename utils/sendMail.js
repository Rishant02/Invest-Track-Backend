const nodemailer = require("nodemailer");

const config = {
  host: "smtp.office365.com",
  port: 587,
  auth: {
    user: process.env.SMTP_EMAIL_PROD,
    pass: process.env.SMTP_PASS_PROD,
  },
};

/**
 * Asynchronously sends an email using Nodemailer.
 *
 * @param {string} to - The email address of the recipient.
 * @param {string} subject - The subject of the email.
 * @param {string} html - The HTML content of the email.
 */
const sendMail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport(config);
    const info = await transporter.sendMail({
      from: process.env.SMTP_EMAIL_PROD,
      to,
      subject,
      html,
    });
    return info;
  } catch (err) {
    throw err;
  }
};

module.exports = sendMail;
