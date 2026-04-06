import User from '../models/User.model.js'; 
import crypto from 'crypto';                 
import bcrypt from 'bcrypt';                 
import { PushNotificationToQueue } from '../Connections/RabbitConnection.js'; 
import password_reset_mail_object from '../templates/password_reset.js';      

export const RequestPasswordReset = async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    try {
        if (!user) {
            return res.status(400).json({ msg: "Email doesnt exist" });
        }

        const token = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();
        
        const resetURL = `${process.env.HOST_SERVER_URL}/reset-password?token=${token}`;

        password_reset_mail_object.email = email;
        password_reset_mail_object.recipient.name = user.name;
        password_reset_mail_object.payload.resetLink = resetURL;
        
        console.log(password_reset_mail_object);
        PushNotificationToQueue(password_reset_mail_object);

        res.json({ msg: "Password reset link has been sent. Please check your mail box" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ msg: "Error while sending mail. Please try again" });
    }
};

export const ResetPassword = async (req, res) => {
    const { token, newPassword, email } = req.body;
    try {
        const user = await User.findOne({ 
            email: email, 
            resetPasswordToken: token, 
            resetPasswordExpires: { $gt: Date.now() } 
        });

        if (!user) {
            return res.status(400).json({ msg: "Invalid or Token Expired" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.resetPasswordExpires = undefined;
        user.resetPasswordToken = undefined;

        await user.save();
        return res.status(200).json({ msg: "Password reset successful" });

    } catch (error) {
        return res.status(500).json({ msg: "Unexpected error while resetting password" });
    }
};
