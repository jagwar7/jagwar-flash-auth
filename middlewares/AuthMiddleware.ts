import jwt from 'jsonwebtoken';
import  firebaseAdmin  from '../config/firebaseAdmin.js'
import { Request, Response, NextFunction } from 'express';
import {ITokenVerifier} from '../Interface/ITokenVerifier.ts'
import { AuthType } from '../utils/AuthType.ts';
import { IAuthenticateRequest } from '../Interface/IAuthenticateRequest.ts';
import { ResponseData } from '../utils/ResponseData.ts';
import UserData from '../utils/UserData.ts';


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
        console.log(`⛔Attempting JWT verification in middleware`)
        try{
            const decodedToken:any = jwt.verify(token, process.env.JWT_SECRET_KEY) as any ;

            req.user = new UserData(decodedToken.id, decodedToken.name, decodedToken.email, AuthType.local);
            next();
        }catch(err:any){  
            console.log(`🎟️Failed to verify token: ${err.name} msg: ${err.message}`)
            res.json(new ResponseData(false, null, "FAILED TO VERIFY TOKEN, PLEASE SIGN IN.", 401))
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
        return res.json(new ResponseData(false, null, 'CLIENT ERROR: No token found, Please sign in.', 401));
    }

    const authType = req.header('X-AuthProvider');  // GET AUTHTYPE HEADER

    token = token.replace(`Bearer `, '');
    
    const verifier:ITokenVerifier = authVerifierMap.get(authType as AuthType);

    if(!verifier){
        return res.json(new ResponseData(false, null, "Unsupported auth provider", 401));
    }
    verifier.VerifyToken(req, res, token, next);
}


