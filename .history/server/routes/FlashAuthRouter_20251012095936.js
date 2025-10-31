const express = require('express'); 
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {RedirectURL}  = require('../utils/constants.js');
const { findOrCreate } = require('../services/clientUserServices.js');
const { UserCredentials } = require('../models/UserCredentials.model.js');


const router = express.Router();



// GET: SEND GOOGLE AUTH URL ---> FLASHAUTH-SDK
router.get('/google/url', async(req, res)=>{
    try {
        const clientId = req.header('X-Client-ID');
        if(!clientId){
            return res.status(400).json({msg: "INTERNAL SERVER ERROR: Missing client ID"});
        }

        // FIND USER CREDENTIALS 
        const userCredentialCollection = req.db.model('UserCredentails', UserCredentials);
        const creds = await userCredentialCollection.findOne({clientPublicKey: clientId});
        if(!creds){
            return res.status(400).json({error: "Invalid ClientID or Missing credentials"});
        }

        const {googleClientId, googleClientSecret} = creds;

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
        return res.status(400).json({msg: "Error while generating google auth URL"});
    }
});
//--------------------------------------------------------------------------------------------------------------














//  GOOGLE AUTH RESPONSE AFTER USER ATTTEMPTS TO LOGIN VIA GOOGLE------------------------------------------------
router.get('/google/callback', async(req, res)=>{
    let creds;
    try {
        const {code, state} = req.query;                                     // NO AUTH CODE OR CLIENT PUBLIC KEY --> CANCEL
        if(!code || !state){
            return res.status(400).send({success: false, msg: "INTERNAL SERVER ERROR: There is an error while generating auth URL, Contact Admin"});
        }
        
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials)
        const ownerdb = userCredentialCollection.findOne({clientPublicKey: state});     // GET SITE OWNER's INFORMATION

        if(!ownerdb){
            return res.status(400).send({success: false, msg: "INTERNAL SERVER ERROR: Missing/Invlid client ID"});
        }
        
        const {googleClientId, googleClientSecret, clientMongoDbUri, tokenExpiryDuration} = ownerdb;
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
            expiresIn: creds.tokenExpiryDuration,
        });

           return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "${creds.clientFrontEndURL}"
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
                    "${creds.clientFrontEndURL}"
                    );
                    window.close();
                </script>
        `);
    }
});










// SIGN UP WITH JWT--------------------------------------------------------------------------------------------
router.post('/local/signup', async(req, res)=>{
    const clientId = req.header('X-Client-Id'); 
    if(!clientId){
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: Missing/Invalid client ID, Contact Admin"});
    }

    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({success: false, message: "INTERNAL SERVER ERROR: All the fields are required"});
    }

    try {
        const userCredentialCollection = req.db.model('UserCredentails', UserCredentials);
        const ownerdb = userCredentialCollection.findOne({clientPublicKey: clientId});
        if(!ownerdb){
            return res.status(400).json({message: "INTERNAL SERVER ERROR: Site could not recognized"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userProfile = {
            name, 
            email,
            password: hashedPassword,
            avatar,
            authProvider: "local"
        }

        // USER WILL BE CREATED OR CHECKED IF ALREADY EXISTS
        const createOrUpdateInDb = await findOrCreate(ownerdb.clientMongoDbUri, userProfile);
        if(createOrUpdateInDb === false){
            return res.status(400).json({success: message: createOrUpdateInDb.message});
        }

        const userObj = {
            name, email, avatar, authProvider: "local"
        }

        const flashToken = jwt.sign(userObj, process.env.JWT_SECRET_KEY, {expiresIn: ownerdb.tokenExpiryDuration});
        return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "${ownerdb.clientFrontEndURL}"
                            );
                            window.close();
                        </script>
                        `);
    } catch (error) {
        return res.send(`
                <script>
                    window.opener.postMessage(
                    { type: "FLASHAUTH_ERROR", error: "Authentication failed" },
                    "${ownerdb.clientFrontEndURL}"
                    );
                    window.close();
                </script>
        `);
    }
})



module.exports = router;
//--------------------------------------------------------------------------------------------------------------