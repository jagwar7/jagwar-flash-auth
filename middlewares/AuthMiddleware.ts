import * as jwt from 'jsonwebtoken';
import  firebaseAdmin  from '../config/firebaseAdmin.js'
import { Request, Response, NextFunction } from 'express';
import {ITokenVerifier} from '../Interface/ITokenVerifier.ts'
import { AuthType } from '../utils/AuthType.ts';
import { IAuthenticateRequest } from '../Interface/IAuthenticateRequest.ts';
import { ResponseData } from '../utils/ResponseData.ts';




interface UserData{
    id: string,
    email: string,
    name: string,
    authType: AuthType,
}

interface JWTUser extends jwt.JwtPayload{
    id: string;
    name: string;
    email: string;
}

// interface AuthenticateRequest extends Request{
//     user?: UserData;
// }

export class GoogleTokenVerifier implements ITokenVerifier{
    async VerifyToken(req: IAuthenticateRequest, res: Response, token:string, next: NextFunction): Promise<any>{
        console.log(`🔁#1: Attempt google auth token verification`);
        try {
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);
            if(!decodedToken){
                console.log(`❌#2: Token verification failed`);
                return res.status(500).json(new ResponseData(false, null, "CLIENT ERROR: No Google Auth token found. Error: verification#2", 500));
            }

            req.user = {
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                authType: AuthType.google
            };
            console.log(`User data: ${req.user}`);

            next();
        } catch (error) {
            console.log(`⛔#3: Server error ${error}`);
            return res.status(401).json(new ResponseData(false, null, "INTERNAL SERVER ERROR: verification#3", 500));
        }
    }
}


export class JWTTokenVerifier implements ITokenVerifier{
    async VerifyToken(req: IAuthenticateRequest, res: Response, token: string, next: NextFunction): Promise<any> {
        try{
            const decodedToken:JWTUser = jwt.verify(token, process.env.JWT_SECRET_KEY) as JWTUser;
            if(!decodedToken){
                return res.status(401).json({success: false, message: "Missing token"});
            }
            req.user = {
                id: decodedToken.id,
                email: decodedToken.email,
                name: decodedToken.name,
                authType: AuthType.local
            };
            next();
        }catch(err){
            
            res.status(401).json({success: false, message: "Invalid token"});
        }
    }
}




const authVerifierMap = new Map<AuthType, ITokenVerifier>();
authVerifierMap.set(AuthType.google, new GoogleTokenVerifier());
authVerifierMap.set(AuthType.local,  new JWTTokenVerifier());






export const HandleTokenVerification = (req, res, next): any=>{
    let token = req.header('Authorization');
    if(!token){
        console.log(`⛔ #1: No token found`);
        return res.status(401).json({success: false, message: "No token passed on"});
    }

    console.log(`🎟️#1: Auth Token: ${token}`);


    const authType = req.header('X-AuthProvider');
    console.log(`🎟️#2: AuthType : ${authType} `);
    
    const verifier:ITokenVerifier = authVerifierMap.get(authType as AuthType);
    if(!verifier){
        return res.json(new ResponseData(false, null, "Unsupported auth provider", 401));
    }
    verifier.VerifyToken(req, res, token, next);

}


