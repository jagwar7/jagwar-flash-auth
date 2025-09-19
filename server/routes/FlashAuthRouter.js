const express = require('express'); 
const UserCredentials = require('../models/UserCredentials.model.js');
const {OAuth2Client} = require('google-auth-library');
const jwt = require('jsonwebtoken');

const router = express.Router();


router.get('/google/url', async(req, res)=>{
    try {
        const {clientId} = req.query;
        console.log("CLIENT ID ", clientId);    
        if(!clientId){
            return res.status(400).json({error: "Client Public ID is required"});
        }

        // FIND USER CREDENTIALS 
        const creds = await UserCredentials.findOne({clientPublicKey: clientId});
        if(!creds){
            return res.status(400).json({error: "Invalid ClientID or Missing credentials"});
        }
        // console.log("CREDENTIALS ", creds);
        const {googleClientId, googleClientSecret, redirectUri} = creds;

        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            redirectUri
        );
        const authURL = oAuthClientInstance.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "select_account",
            state: clientId
        });
        console.log("AUTH URL ", authURL);
        const data = {
            callbackURL: authURL
        }
        return res.json(data);
    } catch (error) {
        console.log("INTERNAL SERVER ERROR ", error);
        return res.status(400).json({msg: "Error while generating google auth URL"});
    }
});





//  GOOGLE AUTH RESPONSE AFTER USER ATTTEMPTS TO LOGIN VIA GOOGLE------------------------------------------------
router.get('/google/callback', async(req, res)=>{
    console.log("ENTERED GOOGLE CALLBACK");
    let creds;
    try {
        const {code, state} = req.query;
        if(!code || !state){
            return res.status(400).send("Missing auth code or client ID");
        }
        creds = await UserCredentials.findOne({ clientPublicKey: state });
        if(!creds){
            return res.status(400).send("Invalid client ID");
        }
        const {googleClientId, googleClientSecret, redirectUri} = creds;
        const oAuthClientInstance = new OAuth2Client(
            googleClientId,
            googleClientSecret,
            redirectUri
        );
        const tokenResponse = await oAuthClientInstance.getToken(code);
        oAuthClientInstance.setCredentials(tokenResponse.tokens.id_token);

        const ticket = await oAuthClientInstance.verifyIdToken({
            idToken: tokenResponse.tokens.id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();

        const userProfile = {
            id: payload.sub,
            name: payload.name,
            email: payload.email,
            picture: payload.picture,
        };
        console.log(creds);

        const flashToken = jwt.sign(userProfile, process.env.JWT_SECRET_KEY, {
        expiresIn: "1h",
        });

           return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "http://localhost:3000"
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
                    "${creds.frontEndURL}"
                    );
                    window.close();
                </script>
        `);
    }
});

module.exports = router;
