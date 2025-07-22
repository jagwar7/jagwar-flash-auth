const User = require('../models/User');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');


const RequestPasswordReset = async(req, res)=>{
    const {email} = req.body;
    const user  = await User.findOne({email});

    try {
        // IF NO USER
        if(!user) {
            return res.status(400).json({msg: "Email doesnt exist"});
        }

        //OTHERWISE
        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 360000 // CURRENT TIME + 10 MINT AHED
        await user.save();
        const resetURL = `${process.env.HOST_SERVER_URL}/reset-password?token=${token}`

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASSWORD
            }
        });
        await transporter.sendMail({
            to: user.email,
            subject: "Password Reset",
            html: `<p>Click <a href="${resetURL}">here</a> to reset your password. This link will expire in 10 minutes.</p>`
        });
        res.json({msg: "Password reset link has been sent. Please check your mail box"});
    } catch (error) {
        console.log(error);
        res.status(500).json({msg: "Error while sending mail. Please try again"});
    }
}





const ResetPassword = async(req, res)=>{
    const {token, newPassword} = req.body;
    try {
        const user = await user.findOne({resetPasswordToken: token, resetPasswordExpires: {$gt: Date.now()}});
        if(!user){
            return res.status(400).json({msg: "Invalid or Token Expired"});
        }

        const hashedPassword = bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;

        await user.save();
        return res.status(200).json({msg: "Password reset successful"});

    } catch (error) {
        return res.status(500).json({msg: "Unexpected error while resetting pasword"});
    }
}

module.exports = {RequestPasswordReset, ResetPassword};