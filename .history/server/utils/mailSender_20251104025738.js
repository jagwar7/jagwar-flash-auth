const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    host: "smtp.zeptomail.in",
    port: 587,
    secure : false,
    auth:{
        user: process.env.EMAIL_API_KEY,
        pass: process.env.EMAIL_PASSWORD_TOKEN
    } 
});



export const SendPasswordResetLink = (receiver, resetURL)=>{
    const mailOptions = {
        from: '"FlashAuth" <noreply@connectjagwar.online',
        receiver,
        subject: "Password Reset Link",
        html: `<p>Click <a href="${resetURL}">here</a> to reset your password. This link will expire in 10 minutes.</p>`
        
    }
}