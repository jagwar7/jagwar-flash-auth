const express = require('express'); 
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {RedirectURL}  = require('../utils/constants.js');
const { findOrCreate, TryLocalSignin, FetchProfile} = require('../services/clientUserServices.js');
const { UserCredentials } = require('../models/UserCredentials.model.js');
const fs = require('fs').promises;
const path = require('path');
const { Decrypt } = require('../utils/encryptions.js');

const successPagePath = path.join(__dirname, '../views/success.html');
const failurePagePath = path.join(__dirname, '../views/faliure.html');

let successPage;
let failurePage;
(async()=>{
  successPage = await fs.readFile(successPagePath, 'utf-8');
  failurePage = await fs.readFile(failurePagePath, 'utf-8');
})();

const router = express.Router();



//RESPONSE PAGE HELPER------------------------------------------------------------------------------------------------
const formatErrorInHtml = ( message, clientFrontEndURL, errorPage)=>{
  return errorPage.replace('{{errorMessage}}', message).replace('{{clientFrontEndURL}}', clientFrontEndURL);
}
//--------------------------------------------------------------------------------------------------------------------





// GET: SEND GOOGLE AUTH URL ---> FLASHAUTH-SDK
router.get('/google/url', async(req, res)=>{
    const clientPublicKey = req.header('X-Client-Id');
    console.log(clientPublicKey);
    try {
        const clientPublicKey = req.header('X-Client-Id');
        if(!clientPublicKey){
            return res.status(400).json({success: false, message: "CLIENT ERROR: Missing client public key, Contact Admin"});
        }

        // FIND USER CREDENTIALS 
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);
        const siteData = await userCredentialCollection.findOne({clientPublicKey: clientPublicKey});

        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }

        let {googleClientId, googleClientSecret} = siteData;  

        googleClientId = Decrypt(googleClientId);
        googleClientSecret = Decrypt(googleClientSecret);

        // FIX: Remove trailing slash and trim
        googleClientId = googleClientId.trim().replace(/\/+$/, '');
        googleClientSecret = googleClientSecret.trim();
        
        console.log(googleClientId, "   ", googleClientSecret);

        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            "http://localhost:5900/api/flashauth/google/callback"
        );
        const authURL = oAuthClientInstance.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "select_account",
            state: clientPublicKey
        });
        console.log("Auth URL at backend: ", authURL);
        if(!authURL){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin"});
        }

        const data = {
            success: true,
            url: authURL
        }
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Error while generating google auth URL, Contact Admin"});
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
            renderHTML = formatErrorInHtml("INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin", clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }
        
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);
        siteData = await userCredentialCollection.findOne({clientPublicKey: state});     // GET SITE OWNER's INFORMATION

        if(!siteData){  // IF NO USER CREDENTIALS---> RETURN ERROR
            renderHTML = formatErrorInHtml("INTERNAL SERVER ERROR: Site data not found, Contact Admin", clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }
            
        console.log(siteData);

        // -----------------------------------------------------------------------------------------
        //EXTRACT USER CREDENTIALS
        let {googleClientId, googleClientSecret, clientMongoDbUri, clientFrontEndURL} = siteData;

        googleClientId = Decrypt(googleClientId);
        googleClientSecret = Decrypt(googleClientSecret);
        clientMongoDbUri = Decrypt(clientMongoDbUri);
        clientFrontEndURL = Decrypt(clientFrontEndURL);
        // -----------------------------------------------------------------------------------------


        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            "http://localhost:5900/api/flashauth/google/callback"
        );

        const tokenResponse = await oAuthClientInstance.getToken(code);     // EXCHANGE  <===> AUTH TOKEN BY PROVIDING AUTH CODE
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
        const createOrUpdateInDb = await findOrCreate(clientMongoDbUri,userProfile);
        if(createOrUpdateInDb == false){
            renderHTML = formatErrorInHtml(createOrUpdateInDb.message, clientFrontEndURL, failurePage);
            return res.set('Content-Type', 'text/html').send(renderHTML);
        }
        //-------------------------------------------------------------------------------------------------------


        //-------------------------------------------------------------------------
        //SIGN JWT FOR CLIENT
        const flashToken = jwt.sign(userProfile, process.env.JWT_SECRET_KEY, {
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

        const createOrUpdateInDb = await findOrCreate(Decrypt(siteData.clientMongoDbUri), userProfile);  // TRY CREATE NEW USER  

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
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
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


module.exports = router;
//--------------------------------------------------------------------------------------------------------------