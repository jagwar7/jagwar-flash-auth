import { Request, Response } from "express";
import IAuthStrategy from "../Interface/IAuthStrategy.ts";
import { AuthType } from "../utils/AuthType.ts";
import { ResponseData } from "../utils/ResponseData.ts";
import userSchema from "../models/User.model.js";
import bcrypt from "bcryptjs";
import UserData from "../utils/UserData.ts";
import generateJWT from "../utils/jwtConfig.ts";
import Validation from "../Validation/Validation.ts";


export default class LocalAuthStrategy implements IAuthStrategy{

    public getAuthType(): AuthType {
        return AuthType.local;
    }

    public async signup(req: Request, res: Response): Promise<ResponseData> {
        console.log(`📝 #1: Entered in local auth sign up`);
        console.log(`-------------------------------------`);

        try {

            
            //-------------------------------------------------------------------------------------------------------------
            // GET AUTH PROVIDER | local_sing_in#1
            const authType:AuthType = req.header('X-AuthProvider') as AuthType;
            if(!authType || authType != AuthType.local){
                return new ResponseData(false, null, `CLIENT ERROR: Invalid Auth Provider. Error_code: local_sing_in#1`, 401);
            }
            console.log(`📝Auth Type: ${authType}`);            
            const {name, email, password}= req.body;
            //-------------------------------------------------------------------------------------------------------------



            //-------------------------------------------------------------------------------------------------------------
            // FIND USER FROM DATABASE | local_sing_in#2
            const User = req.db.model('User', userSchema);
            const isUser = await User.findOne({email: email});
            
            // CHECK IF USER EXIST
            if(isUser){
                console.log(`⛔ #1: User already exist, Please sign in`);
                return new ResponseData(false, null, `User already exist, Please sign in. Error_code: local_sing_in#2`, 409);
            }
            //-------------------------------------------------------------------------------------------------------------



            //-------------------------------------------------------------------------------------------------------------
            // CHECK USER DATA | local_sing_in#3
            const isEmailValid:boolean          = Validation.ValidateEmail(email as string);
            const isPasswordValid:boolean       = Validation.ValidatePassword(password as string);
            const isNameValid:boolean           = Validation.ValidateName(name as string);

            if(!isEmailValid || !isPasswordValid || isNameValid){
                console.log(`📝 #2: Credentials format doesnt match`);
                return new ResponseData(false, null, 'CLIENT ERROR: Name , Email or Password is not matching format. Error_code: local_sing_in#3', 401);
            }
            //-------------------------------------------------------------------------------------------------------------



            //-------------------------------------------------------------------------------------------------------------
            // CREATE NEW USER | local_sing_in#4
            const hashedPassword = await bcrypt.hash(password as string, 10); // ENCODE PASSWORD
            const newUser = new User({
                name:       name,
                email:      email,
                password:   hashedPassword,
                authType:   AuthType.local,
            });

            await newUser.save();
            if(!newUser){
                console.log(`📝 #3: There is a problem while saving user in database`);
                return new ResponseData(false, null, 'SERVER ERROR: There is an error while creating new user in database. Error_code: local_sing_in#4', 409);
            }
            //-------------------------------------------------------------------------------------------------------------




            //-------------------------------------------------------------------------------------------------------------
            // SEND SIGNED JWT | local_sing_in#5
            const userData:UserData = new UserData(newUser._id as any, name as string, email as string, AuthType.local);
            const signedToken = generateJWT(userData);
            return new ResponseData(true, signedToken, `Successfully signed up`, 200);
        } catch (error) {
            console.log(`📝 #4: Server error: ${error}`);
            return new ResponseData(false, null, `INTERNAL SERVER ERROR: Contact Admin. Error_code: local_sing_in#5`, 500);
        }
    }



    
    public async signin(req: Request, res: Response): Promise<ResponseData> {
        console.log(`📝 #1: Entered in local auth sign in`);
        console.log(`-------------------------------------`);

        try {
            //-------------------------------------------------------------------------------------------------------------
            // GET AUTH PROVIDER | local_sing_in#1
            const authType = req.header('X-AuthProvider');
            if(!authType || authType != AuthType.local){
                return new ResponseData(false, null, `CLIENT ERROR: Invalid Auth Provider. Error_code: local_sing_in#1`, 401);
            }
            //-------------------------------------------------------------------------------------------------------------




            //-------------------------------------------------------------------------------------------------------------
            // FIND USER FORM DATABASE | local_sing_in#2
            const {email, password} = req.body;
            const Users = req.db.model('User', userSchema); // USERS DATABASE COLLECTION 
            const user = await Users.findOne({email: email});
            
            // CHECK IF USER EXIST IN DATABASE
            if(!user){
                return new ResponseData(false, null, `CLIENT ERROR: User doesnt exist, Plese sign up. Error_code: local_sing_in#2`, 404);
            }
            //-------------------------------------------------------------------------------------------------------------




            //-------------------------------------------------------------------------------------------------------------
            // CHECK IF PASSWORD MATCH | local_sing_up#3
            const isMatch:boolean = await bcrypt.compare(password as string, user.password);
            if(!isMatch){
                console.log(`⛔ #2: Incorrect Password for user: ${user.email}`);
                return new ResponseData(false, null, `CLIENT ERROR: Password did not match. Error_code: local_sing_in#3`, 401);
            }
            //-------------------------------------------------------------------------------------------------------------




            //-------------------------------------------------------------------------------------------------------------
            //  SEND SIGNED JWT | local_sing_in#5
            const userData = new UserData(user._id.toString(), user.name, user.email, AuthType.local);
            const signedToken = generateJWT(userData);
            console.log(`📝 #3: Signed user data: ${userData}`);
            return new ResponseData(true, signedToken, `Successfully signed in.`, 200);
        } catch (error) {
            return new ResponseData(false, null, `INTERNAL SERVER ERROR: Contact FlashAuth Support. Error_code: local_sing_in#5.`, 200);
        }
    }
}