const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: "smtp.zeptomail.in",
    port: 587 
})