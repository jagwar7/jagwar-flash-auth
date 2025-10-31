const express = require('express');
const router = express.Router();
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');
const { UserCredentials } = require('../models/UserCredentials.model');
const { Encrypt, Decrypt } = require('../utils/encryptions');



// IT WILL BE CALLED WHEN FORM OPENS TO SUBMIT AND WILL BE FETCHED AND FORM DATA WILL BE FILLED
router.get('/get', AuthProviderSwitcher, async(req, res)=>{
    try {
        const UserCredential = req.db.model('UserCredentials', UserCredentials);
        const creds = await UserCredential.findOne({clientPublicKey: "62970"});
        if(!creds){
            return res.status(404).json({error: "No credentials found, Please add your credentials."});
        }
        return res.status(200).json({credentials: creds});
    } catch (error) {
        console.error("Error fetching credentials:", error);
        return res.status(500).json({error: "Error fetching credentials"});
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
 * mongouri: mongodb+srv://flashauthtest:<db_password>@cluster0.4txup3q.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
 */
router.put('/update', AuthProviderSwitcher, async(req, res)=>{
    try {
        const{clientFrontEndURL, clientPublicKey, clientSecretKey, clientMongoDbUri,
             googleClientId, googleClientSecret, tokenExpiryDuration} = req.body;
             console.log(req.body)
        
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
                    return res.status(400).json({err: "All credentials are required"});
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
            creds.clientPublicKey =        Encrypt(clientPublicKey) || creds.clientPublicKey;
            creds.clientSecretKey =        Encrypt(clientSecretKey) || creds.clientSecretKey;
            creds.clientMongoDbUri =      Encrypt(clientMongoDbUri) || creds.clientMongoDbUri;
            creds.googleClientId =          Encrypt(googleClientId) || creds.googleClientId;
            creds.googleClientSecret =  Encrypt(googleClientSecret) || creds.googleClientSecret;
            creds.tokenExpiryDuration =         tokenExpiryDuration || creds.tokenExpiryDuration;
        }

        await creds.save();
        return res.status(200).send({msg: "Credentials saved successfully."});
    } catch (error) {
        console.error("Error updating credentials:", error);
        return res.status(500).json({msg: "There is an error while updating credentials"});
    }
});

module.exports = router;
