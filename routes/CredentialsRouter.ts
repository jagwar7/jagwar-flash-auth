import express from 'express';
const router = express.Router();

import {HandleTokenVerification} from '../middlewares/AuthMiddleware.js';
import { UserCredentials } from '../models/UserCredentials.model.js';
import { Encrypt, Decrypt } from '../utils/encryptions.js';
import { IAuthenticateRequest } from '../Interface/IAuthenticateRequest.ts';
import { ResponseData } from '../utils/ResponseData.ts';




// IT WILL BE CALLED WHEN FORM OPENS TO SUBMIT AND WILL BE FETCHED AND FORM DATA WILL BE POPULATED
router.get('/get', HandleTokenVerification, async(req:IAuthenticateRequest, res)=>{
    try {
        const UserCredential = req.db.model('UserCredentials', UserCredentials);
        let creds = await UserCredential.findOne({owner: req.user.id});
        if(!creds){
            return res.json(new ResponseData(false, null , "No credentials found, Please add your credentials.", 404));
        }
        creds.clientFrontEndURL = Decrypt(creds.clientFrontEndURL);
        creds.clientSecretKey = Decrypt(creds.clientSecretKey);
        creds.googleClientId = Decrypt(creds.googleClientId);
        creds.googleClientSecret = Decrypt(creds.googleClientSecret);
        creds.clientMongoDbUri = Decrypt(creds.clientMongoDbUri);
        return res.status(200).json({success: true, message:"Fetched latest credentials", data: creds});
    } catch (error) {
        return res.status(500).json({success: false, message: "Error fetching credentials"});
    }
});


/**
 * LOGIC:
 *      IF CREDENTIALS EXIST THEN , CREDS WILL BE FETECHED BY GET REQUEST
 *      THEN, FETCHED CREDS WILL BE POPULATED IN THE FORM FIELDS(FRONT END FORM)
 *      
 *      OTHERWISE,
 *         ---> ALL THE REQUIRED FIELDS MUST BE FILLED
 *         ---> THEN, SUBMIT THE FORM
 * 
 * 
 */



router.put('/update', HandleTokenVerification, async(req:IAuthenticateRequest, res)=>{
    try {
        let {clientFrontEndURL, clientPublicKey, clientSecretKey, clientMongoDbUri,
             googleClientId, googleClientSecret, tokenExpiryDuration} = req.body;
        
        const UserCredential = req.db.model('UserCredentials', UserCredentials);
        let creds = await UserCredential.findOne({owner: req.user.id});

        /**
         * LOGIC:
         *  1: IF CREDENTIALS PRESENT ---> task: UPDATE
         *  2: OTHERWISE ---> CREATE NEW CREDS
         */


        if(!creds){  // CREATE NEW CREDENTIALS
            if(!clientFrontEndURL || !clientPublicKey || !clientSecretKey     ||
                !clientMongoDbUri || !googleClientId  || ! googleClientSecret   ){
                    return res.status(400).json({success: false, message: "All credentials are required"});
            }

            clientFrontEndURL = Encrypt(clientFrontEndURL);
            clientMongoDbUri= Encrypt(clientMongoDbUri);
            clientSecretKey= Encrypt(clientSecretKey);
            googleClientId= Encrypt(googleClientId);
            googleClientSecret= Encrypt(googleClientSecret);


            creds = new UserCredential({
                owner: req.user.id,
                clientFrontEndURL,
                clientPublicKey,
                clientSecretKey,
                clientMongoDbUri,
                googleClientId,
                googleClientSecret,
                tokenExpiryDuration                
            });
        }else {
            // UPDATE EXISTING CREDENTIALS------ FRESH DATA---------||------ EXISTING DATA-----
            creds.clientFrontEndURL =    Encrypt(clientFrontEndURL) || creds.clientFrontEndURL;
            creds.clientPublicKey =              clientPublicKey    ||  creds.clientPublicKey;
            creds.clientSecretKey =        Encrypt(clientSecretKey) || creds.clientSecretKey;
            creds.clientMongoDbUri =      Encrypt(clientMongoDbUri) || creds.clientMongoDbUri;
            creds.googleClientId =          Encrypt(googleClientId) || creds.googleClientId;
            creds.googleClientSecret =  Encrypt(googleClientSecret) || creds.googleClientSecret;
            creds.tokenExpiryDuration =         tokenExpiryDuration || creds.tokenExpiryDuration;
        }

        await creds.save();
        return res.status(200).json({success: true, message: "Credentials saved successfully."});
    } catch (error) {
        return res.status(500).json({success: false, message: "There is an error while updating credentials, Contact Admin"});
    }
});

export default router;
