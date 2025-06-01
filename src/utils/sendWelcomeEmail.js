const nodemailer = require('nodemailer');
require('dotenv').config();

const sendWelcomeEmail = async (toEmail, username) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"InstaClone" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: '🎉 Welcome to Socialenz!',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #fafafa; color: #333;">
                    <h2 style="color: #e1306c;">Hey ${username}, welcome to Socialenz! 👋</h2>
                    <p>We’re stoked to have you onboard. Start sharing your moments, following your friends, and exploring the feed.</p>
                    <hr />
                    <p style="font-size: 0.9em;">This is just the beginning. Let’s create something amazing together.</p>
                    <p style="font-size: 0.8em; color: #999;">If this wasn't you, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent');
    } catch (err) {
        console.error('❌ Error sending welcome email:', err);
    }
};

module.exports = sendWelcomeEmail;
