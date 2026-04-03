import { AuthStrategy } from "../Interface/AuthStrategy";
import { Request, Response } from "express";
import firebaseAdmin from '../config/firebaseAdmin';
import {userSchema} from '../models/User.model';
import { generateJWT } from "../utils/jwtConfig";
import { UserData } from "../utils/UserData";
import { ResponseData } from "../utils/ResponseData";
import { AuthType } from "../utils/AuthType";



export class GoogleAuthStrategy implements AuthStrategy{
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
        console.log(`Entered in google auth function...`)
        const googleAuthToken = req.header('Authorization')?.replace('Bearer Google:', "");

        if(!googleAuthToken){
            return new ResponseData(false, null, "CLIENT ERROR: INVALID USER TOKEN", 403);
        }

        try {
            const Users = req.db.model('User', userSchema);
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(googleAuthToken);

            const user = await Users.findOne({email: decodedToken.email}).lean().exec();
            // IF USER EXIST
            if(user){
                const userObject = {
                    id          : user._id,
                    name        : user.name,
                    email       : user.email,
                    authType    : AuthType.google
                }
                console.log('User already exist: ' , userObject);

                const jwtToken = generateJWT(userObject);
                return new ResponseData(true, jwtToken, "Successfully signed in", 200);
            }

            // IF USER DOESNT EXIST , CREATE NEW USER
            const newUser = new Users({
                name        : decodedToken.name,
                email       : decodedToken.email,
                googleId    : decodedToken.uid,
                authType    : AuthType.google    
            });

            await newUser.save();
            console.log(`Saved User: ${newUser}`);
            const userData = new UserData(newUser.id, newUser.name, newUser.email, newUser.authType as AuthType);
            const jwtToken = generateJWT(userData); // SIGN JWT
            console.log(`JWT SIGNED TOKEN : ${jwtToken}`);

            return new ResponseData(true, jwtToken, "Successfully signed up", 201);
        } catch (error) {
            return new ResponseData(false, null, "Successfully signed up", 500);
        }
    }
}