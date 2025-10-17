const express = require('express'); 
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {RedirectURL}  = require('../utils/constants.js');
const { findOrCreate, TryLocalSignin} = require('../services/clientUserServices.js');
const { UserCredentials } = require('../models/UserCredentials.model.js');


const router = express.Router();



// GET: SEND GOOGLE AUTH URL ---> FLASHAUTH-SDK
router.get('/google/url', async(req, res)=>{
    try {
        const clientId = req.header('X-Client-ID');
        if(!clientId){
            return res.status(400).json({success: false, message: "CLIENT ERROR: Missing client public key, Contact Admin"});
        }

        // FIND USER CREDENTIALS 
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);
        const siteData = await userCredentialCollection.findOne({clientPublicKey: clientId});
        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }

        const {googleClientId, googleClientSecret} = siteData;

        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            RedirectURL
        );
        const authURL = oAuthClientInstance.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "select_account",
            state: clientId
        });
        console.log("AUTH URL ", authURL);
        const data = {
            url: authURL
        }
        return res.json(data);
    } catch (error) {
        console.log("INTERNAL SERVER ERROR ", error);
        return res.status(400).json({success: false, msg: "INTERNAL SERVER ERROR: Error while generating google auth URL"});
    }
});
//--------------------------------------------------------------------------------------------------------------------------------------------------------














//  GOOGLE AUTH RESPONSE AFTER USER ATTTEMPTS TO LOGIN VIA GOOGLE-------------------------------------------------------------------------------------------
router.get('/google/callback', async(req, res)=>{
    try {
        const {code, state} = req.query;                                     // NO AUTH CODE OR CLIENT PUBLIC KEY --> CANCEL
        if(!code || !state){
            return res.status(400).send({success: false, msg: "INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin"});
        }
        
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);
        const siteData = userCredentialCollection.findOne({clientPublicKey: state});     // GET SITE OWNER's INFORMATION

        if(!siteData){
            return res.status(400).send({success: false, msg: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }
        
        const {googleClientId, googleClientSecret, clientMongoDbUri} = siteData;
        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            RedirectURL
        );

        const tokenResponse = await oAuthClientInstance.getToken(code);     // EXCHANGE  <===> AUTH TOKEN BY PROVIDING AUTH CODE
        oAuthClientInstance.setCredentials(tokenResponse.tokens.id_token);

        const ticket = await oAuthClientInstance.verifyIdToken({            // RETURN GOOGLE USER INFORMATION AFTER VERIFYING TOKEN
            idToken: tokenResponse.tokens.id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();

        const userProfile = {                                              
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            authProvider: 'google',
        };

        

        /* CREATE USER IN CLIENT'S DATA BASE------------------------------------------------
            TRY TO CREATE OR UPDATE USER IN CLIENT's DATABASE 
            ---> RETURN TYPE TRUE FOR SUCCESSFUL USER CREATION
            ---> RETURN FALSE IF ANY ERROR AND THROW ERROR TO 
                 USER
        */


        // ----------------------------------------------------------------------------------
        const createOrUpdateInDb = await findOrCreate(clientMongoDbUri,userProfile);
        if(createOrUpdateInDb == false){
            return res.status(400).json({success: false, msg: createOrUpdateInDb.message});
        }
        //-----------------------------------------------------------------------------------

        const flashToken = jwt.sign(userProfile, process.env.JWT_SECRET_KEY, {
            expiresIn: siteData.tokenExpiryDuration,
        });

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
        console.error("Google Callback Error:", error);
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
//----------------------------------------------------------------------------------------------------------------------------------------------









// SIGN UP WITH JWT-----------------------------------------------------------------------------------------------------------------------------
router.post('/local/signup', async(req, res)=>{
    const clientId = req.header('X-Client-Id'); 

    if(!clientId){
        return res.status(400).json({success: false, message: "CLIENT ERROR: Missing client public key, Contact Admin"});
    }

    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({success: false, message: "CLIENT ERROR: All the fields are required"});
    }

    let siteData;
    try {
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials);    // FIND CLIENT's USER COLLECTION
        siteData = await userCredentialCollection.findOne({clientPublicKey: clientId});

        if(!siteData){
            return res.status(400).json({message: "INTERNAL SERVER ERROR: Site data not found, Contact Admin"});
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const userProfile = {
            name, 
            email,
            passwordHash: hashedPassword,
            authProvider: "local"
        }

        const createOrUpdateInDb = await findOrCreate(siteData.clientMongoDbUri, userProfile);  // TRY CREATE NEW USER  

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

        return res.status(200).json({success: true, message: signInResponse.message, data: signInResponse.data});

    } catch (error) {
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Contact Admin"});
    }
});
//---------------------------------------------------------------------------------------------------------------------------------------------












// FETCH USER PROFILE--------------------------------------------------------------------------------------------------------------------------
/**
 * LOGIC: REQUIRED FILDS: CLIENT ID AS WELLL AS AUTH TOKEN
 */

router.get('/fetch/profile', (req, res)=>{
    const clientId = req.header('X-Client-Id');
    if(!clientId){
        return res.status(400).json({success: false, msg: "CLIENT ERROR: Missing client public key, Contact Admin"});
    }

    const token = req.header('Authorization')?.replace("local", "");
    if(!token){
        return res.status(400).json({success: false, msg: "CLIENT ERRROR: Missing Auth Token, Please sign in"});
    }

    let siteData;
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if(!decodedToken.email){
            return res.status(400).json({success: false, message: "CLIENT ERROR: Invalid Token, Please sign in"});
        }

        const userCredentialCollections = req.db.model('UserCredentials', UserCredentials);
        siteData = await userCredentialCollections.findOne({clientPublicKey: clientId});
        if(!siteData){
            return res.status(400).json({success: false, message: "INTERNAL SERVER"})
        }
    } catch (error) {
        
    }
})


module.exports = router;
//--------------------------------------------------------------------------------------------------------------