import {HandleTokenVerification} from '../middlewares/AuthMiddleware.ts'
import {RequestPasswordReset, ResetPassword} from '../Managers/PasswordManager.js';
import {Router, Request, Response} from 'express';
import { AuthType } from '../utils/AuthType.ts';
import { authFactory } from '../Managers/AuthManager.ts';
import { ResponseData } from '../utils/ResponseData.ts';
import { IAuthenticateRequest } from '../Interface/IAuthenticateRequest.ts';

const authRouter = Router();


/**
 * ON GOOGLE SIGN IN REQUEST --->
 * 1. GET AUTH TYPE
 * 2. GET CORRESPONDING AUTH STRATEGY BY AUTH TYPE (E.G: GOOGLE AUTH STRATEGY)
 * 3. CALL THAT AUTH STRATEGY.SIGN_UP()
 * 4. RETURN RESPONSE PROVIDED BY AUTH STRATEGY
 *  */ 

authRouter.post("/signup", async(req: Request, res: Response) =>{
    console.log(`LOG 1: Attempt to sign up with google...`)
    try {
        const type = req.header('X-AuthProvider') as AuthType;
        console.log(`LOG 2: AuthType from req.params: ${type} ...`)
        const authStrategy = authFactory.authMap.get(type);
        console.log(authStrategy.getAuthType());

        // IF NO AUTH STRATEGY ----> THEN RETURN NAGETIVE RESPONSE
        if(!authStrategy){
            const response = new ResponseData(false, null, "UNSUPPORTED AUTH PROVIDER", 400);
            return res.status(response.status).json(response);
        }
        const result = await authStrategy.signup(req, res);
        return res.status(result.status).json(result);
    } catch (error) {
        const response = new ResponseData(false, null, `INTERNAL SERVER ERROR: ${error.message}`, 500);
        return res.status(response.status).json(response);
    }
});



/**
 * ON GOOGLE SIGN IN REQUEST --->
 * 1. GET AUTH TYPE
 * 2. GET CORRESPONDING AUTH STRATEGY BY AUTH TYPE (E.G: GOOGLE AUTH STRATEGY)
 * 3. CALL THAT AUTH STRATEGY.SIGN_IN()
 * 4. RETURN RESPONSE PROVIDED BY AUTH STRATEGY
 *  */ 

authRouter.post("/signin", async(req: Request, res: Response) =>{
    console.log(`🔁#1: Attempt to sign in`)
    try {

        const type = req.header('X-AuthProvider') as AuthType;
        console.log(`🎟️#2: AuthType from req.params: ${type} ...`);

        const authStrategy = authFactory.authMap.get(type);

        // IF NO AUTH STRATEGY ----> THEN RETURN NAGETIVE RESPONSE
        if(!authStrategy){
            const response = new ResponseData(false, null, "UNSUPPORTED AUTH PROVIDER", 400);
            return res.json(response);
        }
        console.log(`📝 #3: Authstrategy: ${authStrategy.getAuthType()}`);
        
        const response = await authStrategy.signin(req, res);
        return res.status(response.status).json(response);
    } catch (error) {
        console.error(`Error: `, error);
        const response = new ResponseData(false, null, `INTERNAL SERVER ERROR: ${error.message}`, 500);
        return res.status(response.status).json(response);
    }
});






authRouter.get('/profile', HandleTokenVerification, (req:IAuthenticateRequest, res) => {
    res.json({ user: req.user });
});

authRouter.post('/password-reset-request', (req, res, next) => {
    next();
}, RequestPasswordReset);

authRouter.post('/reset-password', (req, res, next) => {
    next();
}, ResetPassword);

export default authRouter;