const express = require('express'); 
const bcrypt = require('bcryptjs');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');
const {RedirectURL}  = require('../utils/constants.js');
const { findOrCreate } = require('../services/clientUserServices.js');
const { UserCredentials } = require('../models/UserCredentials.model.js');


const router = express.Router();


router.get('/google/url', async(req, res)=>{
    try {
        const {clientId} = req.query;
        if(!clientId){
            return res.status(400).json({error: "Client Public Key   is required"});
        }

        // FIND USER CREDENTIALS 
        const userCredentialCollection = req.db.model('UserCredentails', UserCredentials)
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
    console.log("ENTERED GOOGLE CALLBACK");
    let creds;
    try {
        const {code, state} = req.query;                                     // NO AUTH CODE OR CLIENT PUBLIC KEY --> CANCEL
        if(!code || !state){
            return res.status(400).send("Missing auth code or client ID");
        }
        
        const userCredentialCollection = req.db.model('UserCredentials', UserCredentials)
        const creds = await userCredentialCollection.findOne({clientPublicKey: state});     // FIND FlashAuth CLIENT's INFORMATION
        
        if(!creds){
            return res.status(400).send("Invalid client ID");
        }
        console.log(creds);
        const {googleClientId, googleClientSecret, clientMongoDbUri, tokenExpiryDuration} = creds;
        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            RedirectURL
        );
        const tokenResponse = await oAuthClientInstance.getToken(code);     // oAuth CLIENT WILL VERIFY AUTH CODE WITH CORRESPONDING CREDENTAILS
        oAuthClientInstance.setCredentials(tokenResponse.tokens.id_token);

        const ticket = await oAuthClientInstance.verifyIdToken({            // RETURN GOOGLE USER INFORMATION AFTER VERIFYING TOKEN
            idToken: tokenResponse.tokens.id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();

        const userProfile = {                                              // DESTRUCTRE USER VERIFIED DATA
            name: payload.name,
            email: payload.email,
            avatar: payload.picture,
            authProvider: 'google',
        };

        

        // CREATE USER IN CLIENT'S DATA BASE------------------------------------------------
        // 1> Check if user exist by email ( payload.email)
        //      if exist then, return signed JWT to FlashAUth SDK (means, client front end);
        // 2> IF user doesnt exist ,CREATE NEW USERS


        // ----------------------------------------------------------------------------------
        const createOrUpdateInDb = await findOrCreate(clientMongoDbUri,userProfile);
        console.log(createOrUpdateInDb); // log the response of user createion
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
        return res.status(400).json({message: "Missing client id"});
    }

    const {name, email, password} = req.body;
    if(!name || !email || !password){
        return res.status(400).json({message: "All the fields are required"});
    }

    try {
        const userCredentialCollection = req.db.model('UserCredentails', UserCredentials);
        const ownerdb = userCredentialCollection.findOne({clientPublicKey: clientId});
        if(!ownerdb){
            return res.status(400).json({message: "INTERNAL SERVER ERROR: Site could recognized"});
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userProfile = {
            name, 
            email,
            hashedPassword,
            avatar: avatar || "",
            authProvider: "local"
        }

        const createOrUpdateInDb = await findOrCreate(ownerdb.clientMongoDbUri, userProfile);
        if(createOrUpdateInDb === true){
            return res.status(400).json({message: "User already exists "})
        }

    } catch (error) {
        
    }
})



module.exports = router;
//--------------------------------------------------------------------------------------------------------------