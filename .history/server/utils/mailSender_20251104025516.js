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



export const SendPasswordResetLink = (receiver)=>{
    const mailOptions = {
        from: '"FlashAuth" <noreply@connectjagwar.online'
    }
}