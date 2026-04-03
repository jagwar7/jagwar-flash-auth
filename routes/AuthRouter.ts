import {HandleTokenVerification} from '../middlewares/AuthMiddleware'
const PasswordManager = require('../Managers/PasswordManager');


import {Router, Request, Response} from 'express';
import { AuthType } from '../utils/AuthType';
import { authFactory } from '../Authentication/AuthManager';
import { ResponseData } from '../utils/ResponseData';
import { IAuthenticateRequest } from '../Interface/IAuthenticateRequest';

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
    console.log(`LOG 1: Attempt to sign up with google...`)
    try {

        const type = req.header('X-AuthProvider') as AuthType;
        console.log(`LOG 2: AuthType from req.params: ${type} ...`)

        const authStrategy = authFactory.authMap.get(type);
        // console.log(authStrategy.getAuthType());

        // IF NO AUTH STRATEGY ----> THEN RETURN NAGETIVE RESPONSE
        if(!authStrategy){
            console.error(`Strategy not found`);
            const response = new ResponseData(false, null, "UNSUPPORTED AUTH PROVIDER", 400);
            return res.status(response.status).json(response);
        }
        console.log(`strategy: ${authStrategy.getAuthType()}`);
        const result = await authStrategy.signup(req, res);
        return res.status(result.status).json(result);
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
}, PasswordManager.RequestPasswordReset);

authRouter.post('/reset-password', (req, res, next) => {
    next();
}, PasswordManager.ResetPassword);

module.exports = authRouter;