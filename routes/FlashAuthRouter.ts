import { ResponseData } from '../utils/ResponseData.ts';
import express from 'express';
import bcrypt from 'bcryptjs';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { findOrCreate, TryLocalSignin, FetchProfile } from '../services/clientUserServices.ts';
import { UserCredentials } from '../models/UserCredentials.model.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Decrypt } from '../utils/encryptions.js';
import dotenv from 'dotenv';
import { getSiteData } from '../utils/redisCache.js';
import serverURL from '../utils/constants.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const successPagePath = path.join(__dirname, '../views/success.html');
const failurePagePath = path.join(__dirname, '../views/faliure.html');





let successPage;
let failurePage;
let _clientFrontEndURL;
(async()=>{
  successPage = await fs.readFile(successPagePath, 'utf-8');
  failurePage = await fs.readFile(failurePagePath, 'utf-8');
})();

const router = express.Router();



//RESPONSE PAGE HELPER------------------------------------------------------------------------------------------------
const formatErrorInHtml = ( message, clientFrontEndURL, errorPage)=>{
  return errorPage.replace(/{{errorMessage}}/g, message).replace(/{{clientFrontEndURL}}/g, clientFrontEndURL);
}
//--------------------------------------------------------------------------------------------------------------------






/** 
 *  FETCH GOOGLE AUTH URL AND HANDOVER IT TO FLASH AUTH SDK
 */

router.get('/google/url', async(req, res)=>{
    const clientPublicKey = req.header('X-Client-Id');
    try {

        //------------------------------------------------------------------------------------------------------------------------------
        //1. IF NO CLIENT PUBLIC KEY PROVIDED
        if(!clientPublicKey){
            const response = new ResponseData(false, null, "CLIENT ERROR: Missing client public key", 400);
            return res.json(response);
        }
        //------------------------------------------------------------------------------------------------------------------------------




        //------------------------------------------------------------------------------------------------------------------------------
        //2. FETCH USER SITE CONFIGS FROM FLASHAUTH DATABASE
        const siteData = await getSiteData(clientPublicKey, req.db);

        if(!siteData){
            return res.json(new ResponseData(false, null, "CLIENT ERROR: There is a problem with credentials", 400));
        }
        //------------------------------------------------------------------------------------------------------------------------------




        //------------------------------------------------------------------------------------------------------------------------------
        //3. DECODE USER CREDENTIALS
        let {googleClientId, googleClientSecret, clientFrontEndURL} = siteData;  
        _clientFrontEndURL = Decrypt(clientFrontEndURL);
        googleClientId = Decrypt(googleClientId);
        googleClientSecret = Decrypt(googleClientSecret);

        googleClientId = googleClientId.trim().replace(/\/+$/, '');
        googleClientSecret = googleClientSecret.trim();
        //------------------------------------------------------------------------------------------------------------------------------



        //------------------------------------------------------------------------------------------------------------------------------
        //4. GENERATE O AUTH URL
        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            `${serverURL}/api/flashauth/google/callback`
        );

        const authURL = oAuthClientInstance.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "select_account",
            state: clientPublicKey
        });
        //------------------------------------------------------------------------------------------------------------------------------




        //------------------------------------------------------------------------------------------------------------------------------
        //5. IF FAILED TO GENERATE O AUTH URL , 
        if(!authURL){
            return res.json(new ResponseData(false, null, "CLIENT ERROR: FAILED TO GERENATE OAUTH URL, CHECK YOUR CREDENTIALS", 400));
        }
        //------------------------------------------------------------------------------------------------------------------------------
        
        
        const data = { url: authURL };
        const response = new ResponseData(true, data, "Successfully fetched oAuthURL", 200);
        return res.json(response);
    } catch (error) {
        const response = new ResponseData(false, null, "INTERNAL SERVER ERROR: Contact Admin", 400);
        return res.json(response);
    }
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------













let renderHTML;

//  GOOGLE AUTH RESPONSE AFTER USER ATTTEMPTS TO LOGIN VIA GOOGLE-------------------------------------------------------------------------------------------
router.get('/google/callback', async(req, res)=>{
    let siteData;
    try {
        const {code, state} = req.query;                                     // NO AUTH CODE OR CLIENT PUBLIC KEY --> CANCEL
        if(!code || !state){
            console.log(`⛔1 :  No ${!code? 'code' : 'clientPublicKey'} in callback , front end: ${_clientFrontEndURL}`);
            renderHTML = formatErrorInHtml("INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin", _clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }

        const clientPublicKey = state;

        siteData = await getSiteData(clientPublicKey, req.db); // GET SITE DATA BY CLIENT PUBLIC KEY

        if(!siteData){  // IF NO USER CREDENTIALS---> RETURN ERROR
            console.log(`⛔2 : No site data found in callback`);
            renderHTML = formatErrorInHtml("INTERNAL SERVER ERROR: There is an error with sign in, Contact Admin. Error callback#2", _clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }



        // -----------------------------------------------------------------------------------------
        //EXTRACT USER CREDENTIALS
        let {googleClientId, googleClientSecret, clientMongoDbUri, clientFrontEndURL} = siteData;
        //------------------------------------------------------------------------------------------


        googleClientId = Decrypt(googleClientId).trim().replace(/\/+$/, '');
        googleClientSecret = Decrypt(googleClientSecret).trim();
        clientMongoDbUri = Decrypt(clientMongoDbUri);
        clientFrontEndURL = Decrypt(clientFrontEndURL);
        // -----------------------------------------------------------------------------------------

        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            `${serverURL}/api/flashauth/google/callback`
        );


        if(!oAuthClientInstance){
            console.log(`⛔3 : No oAuthClientInstacne found in callback`);
            renderHTML = formatErrorInHtml("INTERNAL SERVER ERROR: There is an error with sing in, Contact Admin. Error callback#3", _clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }

        const tokenResponse:any = await oAuthClientInstance.getToken(code as string);     // EXCHANGE  <===> AUTH TOKEN BY PROVIDING AUTH CODE
        oAuthClientInstance.setCredentials(tokenResponse.tokens.id_token);

        const ticket = await oAuthClientInstance.verifyIdToken({            // RETURN GOOGLE USER INFORMATION AFTER VERIFYING TOKEN
            idToken: tokenResponse.tokens.id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();


        // ----------------------------------
        //RESPONSE OBJECT FOR CLIENT
        const userProfile = {                                              
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            authProvider: 'google',
        };
        //------------------------------------
        

        /* CREATE USER IN CLIENT'S DATA BASE------------------------------------------------
            TRY TO CREATE OR UPDATE USER IN CLIENT's DATABASE 
            ---> RETURN TYPE TRUE FOR SUCCESSFUL USER CREATION
            ---> RETURN FALSE IF ANY ERROR AND THROW ERROR TO 
                USER
        */


        // ------------------------------------------------------------------------------------------------------
        // TRY CRAETE / UPDATE USER IN CLIENT's MONGODB
        const createOrUpdateInDb:any = await findOrCreate(clientMongoDbUri,userProfile);
        if(createOrUpdateInDb.success == false){
            renderHTML = formatErrorInHtml(createOrUpdateInDb.message, clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }
        //-------------------------------------------------------------------------------------------------------


        //-------------------------------------------------------------------------
        //SIGN JWT FOR CLIENT
        const userObject = {
            ...userProfile,
            // role : createOrUpdateInDb.user.role
        }

        console.log(`name and role : ${userProfile.name}, ${createOrUpdateInDb.user.role}`)
        const flashToken = jwt.sign(userObject, process.env.JWT_SECRET_KEY, {
            expiresIn: siteData.tokenExpiryDuration,
        });
        //-------------------------------------------------------------------------


        // CREATE RESPONSE HTML
        renderHTML = successPage.replace('{{flashToken}}', flashToken).replace('{{clientFrontEndURL}}', clientFrontEndURL);



        //----------------------------------------------------------------
        // ✅ SUCCESS RESPONSE
        console.log("SUCCESS: RESPONSE");
        return res.set('Content-Type', 'text/html').send(renderHTML);
        //----------------------------------------------------------------


    } catch (error) {
        renderHTML = formatErrorInHtml('INTERNAL SERVER ERROR: There is a technical error, Contact Admin', 
        Decrypt(siteData?.clientFrontEndURL) || '', failurePage);
        return res.set('Content-Type', 'text/html').send(renderHTML);
    }
});
//----------------------------------------------------------------------------------------------------------------------------------------------









// SIGN UP WITH JWT-----------------------------------------------------------------------------------------------------------------------------
router.post('/local/signup', async(req, res)=>{
    const clientPublicKey = req.header('X-Client-Id'); 

    if(!clientPublicKey){
        return res.status(400).json({success: false, message: "CLIENT ERROR: Missing client public key, Contact Admin"});
    }

    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({success: false, message: "CLIENT ERROR: All the fields are required"});
    }

    let siteData;
    try {

        //-----------------------------------------------------------------------------------------------------------------------
        // FIND CLIENT's USER COLLECTION
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);    
        siteData = await userCredentialCollection.findOne({clientPublicKey: clientPublicKey});

        if(!siteData){
            return res.status(400).json({message: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }
        //-----------------------------------------------------------------------------------------------------------------------

        const hashedPassword = await bcrypt.hash(password, 10);

        const userProfile = {
            name, 
            email,
            passwordHash: hashedPassword,
            authProvider: "local"
        }

        const createOrUpdateInDb:any = await findOrCreate(Decrypt(siteData.clientMongoDbUri), userProfile);  // TRY CREATE NEW USER  

        // USER WILL BE CREATED OR CHECKED IF ALREADY EXISTS
        if(createOrUpdateInDb.success === false){
            return res.status(400).json({success: false, message: createOrUpdateInDb.message});
        }

        const userObj = {
            name, email, authProvider: "local"
        }



        const flashToken = jwt.sign(userObj, process.env.JWT_SECRET_KEY, {expiresIn: siteData.tokenExpiryDuration});
        return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "${siteData.clientFrontEndURL}"
                            );
                            window.close();
                        </script>
                        `);
    } catch (error) {
        return res.send(`
                <script>
                    window.opener.postMessage(
                    { type: "FLASHAUTH_ERROR", error: "Authentication failed" },
                    "${siteData.clientFrontEndURL}"
                    );
                    window.close();
                </script>
        `);
    }
});


// SIGN IN WITH JWT ------------------------------------------------------------------------------------------------------------------------------
/**
 * MAIN LOGIC:
 *  FIND () SITE OWNER'S DB
 *  
 *  
 * 
 * 
 */



router.post('/local/signin', async(req, res)=>{
    const clientId = req.header('X-Client-Id');
    if(!clientId){
        return res.status(400).json({success: false, message: 'CLIENT ERROR: Missing client public key, Contact Admin'});
    }

    const {email, password, authType} = req.body;
    if(!email || !password || !authType){
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Missing email or password or Auth Provider"});
    }

    let siteData;
    try {
        const siteOwnerCredentials = req.db.model('UserCredentials', UserCredentials);
        siteData = await siteOwnerCredentials.findOne({clientPublicKey: clientId});
        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
        }
        const userProfileInfo = {
            email,
            password,
            authProvider : "local"
        }
        const signInResponse = await TryLocalSignin(siteData.clientMongoDbUri, userProfileInfo);

        if(signInResponse.success === false){
            return res.status(400).json({success: false, message: signInResponse.message});
        }

        const userObj = {
            name : signInResponse.data.name,
            email: signInResponse.data.email,
            authProvider: "local"
        }
        const flashToken = jwt.sign(userObj, process.env.JWT_SECRET_KEY, {expiresIn: siteData.tokenExpiryDuration});
        return res.status(200).json({success: true, message: signInResponse.message, data: flashToken});

    } catch (error) {
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
    }
});
//---------------------------------------------------------------------------------------------------------------------------------------------











// FETCH USER PROFILE--------------------------------------------------------------------------------------------------------------------------
/**
 * LOGIC: REQUIRED FILDS: CLIENT ID AS WELLL AS AUTH TOKEN
 */

router.get('/fetch/profile', async(req, res)=>{
    const clientId = req.header('X-Client-Id');
    if(!clientId){
        return res.status(400).json({success: false, msg: "CLIENT ERROR: Missing client public key, Contact Admin"});
    }

    const token = req.header('Authorization')?.replace("Bearer:", "");

    if(!token){
        return res.status(400).json({success: false, msg: "CLIENT ERRROR: Missing Auth Token, Please sign in"});
    }

    let siteData;
    try {
        const decodedToken:any = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if(!decodedToken){
            return res.status(400).json({success: false, message: "CLIENT ERROR: Invalid Token, Please sign in"});
        }

        const userCredentialCollections = req.db.model('UserCredentials', UserCredentials);
        siteData = await userCredentialCollections.findOne({clientPublicKey: clientId});

        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
        }
        
        const userProfile = {
            email: decodedToken.email
        }

        const fetchProfileResponse = await FetchProfile(siteData.clientMongoDbUri, userProfile);
        if(fetchProfileResponse.success == false){
            return res.status(400).json(fetchProfileResponse);
        }

        // SUCCESSFULLY FETCHED
        return res.status(200).json(fetchProfileResponse);

    } catch (error) {
        return res.status(400).json({success: false, message: "UNKNOWN SERVER ERROR: Contact Admin"});
    }
});


export default router;
//--------------------------------------------------------------------------------------------------------------