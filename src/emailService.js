const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendFollowUpEmail(toEmail, name) {
    const msg = {
        to: toEmail,
        from: 'rusthyahamed2001@gmail.com', // Replace with your VERIFIED sender email
        subject: 'Thank You for Your Application',
        text: `Dear ${name},\n\nThank you for applying! We’ve received your CV and will review it soon.\n\nBest regards,\nThe Team`,
        send_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // Schedule for 24 hours later
    };

    try {
        await sgMail.send(msg);
        console.log(`Email scheduled for ${toEmail}`);
    } catch (error) {
        console.error('SendGrid Error:', error.response ? error.response.body : error.message);
        throw error; // Re-throw to be caught in server.js
    }
}

module.exports = { sendFollowUpEmail };