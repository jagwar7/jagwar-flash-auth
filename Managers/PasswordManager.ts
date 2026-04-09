import userSchema from '../models/User.model.js'; 
import crypto from 'crypto';                 
import bcrypt from 'bcrypt';                 
import password_reset_mail_object from '../templates/password_reset.js';      
import { ResponseData } from '../utils/ResponseData.ts';
import { Request, Response } from 'express';
import EmailService from '../services/EmailService.ts';
import INotificationService from '../Interface/INotificationService.ts';

export const RequestPasswordReset = async (req:Request, res: Response) => {
    const { email } = req.body || {};

    try {
        //-------------------------------------------------------------------------------------------------------------------
        // CHECK IF USER EXIST 
        const UserSchema    = req.db.model('User', userSchema);
        const user          = await UserSchema.findOne({ email: email });

        if (!user) {
            return res.json(new ResponseData(false, null, 'CLIENT ERROR: User doesnt exist. Please sign up.', 401));
        }
        //-------------------------------------------------------------------------------------------------------------------




        //-------------------------------------------------------------------------------------------------------------------
        // GENERATE TOKEN
        const generatedToken:string = crypto.randomBytes(32).toString('hex');
        user.resetPasswordToken = generatedToken;
        user.resetPasswordExpires = new Date(Date.now() + 360000); 
        await user.save();
        
        const resetURL = `${process.env.FRONTEND_URL}/reset-password/${generatedToken}`;
        //-------------------------------------------------------------------------------------------------------------------




        //-------------------------------------------------------------------------------------------------------------------
        // SEND TOKNE IN MAIL
        password_reset_mail_object.email                = email;
        password_reset_mail_object.recipient.name       = user.name;
        password_reset_mail_object.payload.resetLink    = resetURL;

        const emailService:INotificationService = new EmailService();
        const mailResponse:ResponseData = await emailService.sendNotification(password_reset_mail_object);  
        return mailResponse;
        
        //-------------------------------------------------------------------------------------------------------------------

    } catch (error) {
        console.log(error);
        return res.json(new ResponseData(false, null, 'INTERNAL SERVER ERROR: Contact Admin', 501));
    }
};




export const ResetPassword = async (req, res) => {
    const { token, newPassword, email } = req.body;

    try {
        //-------------------------------------------------------------------------------------------------------------------
        // reset_password#1
        const User = req.db.model('User', userSchema);
        const user = await User.findOne({ 
            email                   : email, 
            resetPasswordToken      : token, 
            resetPasswordExpires    : { $gt: Date.now() } 
        });

        if (!user) {
            return res.json(new ResponseData(false, null, 'CLIENT ERROR: Email id is invalid or token is expired. Error_code: reset_password#1', 401));
        }
        //-------------------------------------------------------------------------------------------------------------------


        
        //-------------------------------------------------------------------------------------------------------------------
        // RESET USER DATA AS PREVIOUS
        const hashedPassword:string     = await bcrypt.hash(newPassword, 10);
        user.password                   = hashedPassword;
        user.resetPasswordExpires       = undefined;
        user.resetPasswordToken         = undefined;
        //-------------------------------------------------------------------------------------------------------------------


        await user.save();
        return res.json(new ResponseData(true, null, 'Password has been reset. Please sign in', 200));
    } catch (error) {
        console.log(`📝 #3: There is an error: ${error}`);
        return res.json(new ResponseData(false, null, 'INTERNAL SERVER ERROR: Error_code: reset_password#2', 500));
    }
};
