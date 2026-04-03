import * as jwt from 'jsonwebtoken';
import  firebaseAdmin  from '../config/firebaseAdmin'
import { Request, Response, NextFunction } from 'express';
import {ITokenVerifier} from '../Interface/ITokenVerifier'
import { AuthType } from '../utils/AuthType';
import { IAuthenticateRequest } from '../Interface/IAuthenticateRequest';




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
        try {
            const decodedToken = await firebaseAdmin.auth().verifyIdToken(token);

            req.user = {
                id: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                authType: AuthType.google
            };
            console.log(req.user);

            next();
        } catch (error) {
            console.log(error);
            return res.status(401).json({msg: "Invalid or Expired sing in credentials"});
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
        return res.status(401).json({success: false, message: "No token passed on"});
    }

    const authType = req.header('X-AuthProvider');

    const verifier:ITokenVerifier = authVerifierMap[authType]
    verifier.VerifyToken(req, res, token, next);

    return res.status(401).json({success: false, message: "Unsupported login provider"});
}


