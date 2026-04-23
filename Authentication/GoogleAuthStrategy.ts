import IAuthStrategy from "../Interface/IAuthStrategy.ts";
import { Request, Response } from "express";
import firebaseAdmin from '../config/firebaseAdmin.ts';
import userSchema from '../models/User.model.js';
import generateJWT  from "../utils/jwtConfig.ts";
import UserData from "../utils/UserData.ts";
import { ResponseData } from "../utils/ResponseData.ts";
import { AuthType } from "../utils/AuthType.ts";
import NotificationSender from "../services/NotificationSender.ts";
import { EmailNotificationData } from "../services/NotificationData.ts";



export class GoogleAuthStrategy implements IAuthStrategy{
    async signup(req: Request, res: Response): Promise<ResponseData> {
        return await this.handleGoogleAuth(req, res);
    }
    
    async signin(req: Request, res: Response): Promise<ResponseData> {
        return await this.handleGoogleAuth(req, res);
    }

    getAuthType(): AuthType {
        return AuthType.google;
    }



    // HANDLE SIGN UP AND SIGN UP IN SMAE FUNCTION
    private async handleGoogleAuth(req: Request, res: Response): Promise<any>{
        const googleAuthToken = req.header('Authorization')?.replace('Bearer ', '');
        const type = req.header('X-AuthProvider');

        if(!type || type != AuthType.google){
            return new ResponseData(false, null, "CLIENT ERROR: Invalid auth provider. Error_code: google_auth#1", 403);
        }
        if(!googleAuthToken){
            return new ResponseData(false, null, "CLIENT ERROR: INVALID USER TOKEN. Error_code: google_auth#2", 403);
        }

        try {
            const Users = req.db.model('User', userSchema);
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(googleAuthToken);

            const user = await Users.findOne({email: decodedToken.email}).lean().exec();

            //----------------------------------------------------------------------------------------------------------
            // IF USER EXIST
            if(user){
                const userObject:UserData = new UserData(user._id.toString(), user.name, user.email, AuthType.google);
                const signedToken:string = generateJWT(userObject);
                return new ResponseData(true, signedToken, "Successfully signed in. Error_code: google_auth#3", 200);
            }
            //----------------------------------------------------------------------------------------------------------



            //----------------------------------------------------------------------------------------------------------
            // IF USER DOESNT EXIST , CREATE NEW USER
            const newUser = new Users({
                name        : decodedToken.name,
                email       : decodedToken.email,
                googleId    : decodedToken.uid,
                authType    : AuthType.google    
            });

            await newUser.save();
            //----------------------------------------------------------------------------------------------------------

            
            console.log(`Saved User: ${newUser}`);


            //----------------------------------------------------------------------------------------------------------
            // SEND SIGNED TOKEN
            const userData = new UserData(newUser.id, newUser.name, newUser.email, newUser.authType as AuthType);
            const signedToken:string = generateJWT(userData); // SIGN JWT
            console.log(`JWT SIGNED TOKEN : ${signedToken}`);
            //----------------------------------------------------------------------------------------------------------



            //----------------------------------------------------------------------------------------------------------
            // SEND WELCOME MAIL
            const emailData:EmailNotificationData = new EmailNotificationData(userData.email, "", userData.name, "flashauth.connectjagwar.online/update-credentials" )
            NotificationSender.send_welcome_email(emailData);
            //----------------------------------------------------------------------------------------------------------
            

            return new ResponseData(true, signedToken, "Successfully signed up", 201);
        } catch (error) {
            console.log(error);
            return new ResponseData(false, null, "INTERNAL SERVER ERROR: Error_code: google_auth#4", 500);
        }
    }
}