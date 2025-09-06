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
        const {firebaseAppID, firebaseAPIkey, redirectUri} = creds;

        const oAuthClientInstance = new OAuth2Client(
            firebaseAppID,
            firebaseAPIkey,
            redirectUri
        );
        const authURL = oAuthClientInstance.generateAuthUrl({
            access_type: "offline",
            scope: ["profile", "email"],
            prompt: "select_account"
        });
        console.log("AUTH URL ", authURL);
        return res.json({authURL: authURL});
    } catch (error) {
        console.log("INTERNAL SERVER ERROR ", error);
        return res.status(400).json({msg: "Error while generating google auth URL"});
    }
});




router.get('/google/callback', async(req, res)=>{
    try {
        const {code, clientId} = req.query;
        if(!code || !clientId){
            return res.status(400).send("Missing auth code or client ID");
        }
        const creds = await UserCredentials.findOne({ clientPublicId: clientId });
        if(!creds){
            return res.status(400).send("Invalid client ID");
        }

        const {firebaseAppID, firebaseAPIkey, redirectUri} = creds;
        const oAuthClientInstance = new OAuth2Client(
            firebaseAppID,
            firebaseAPIkey,
            redirectUri
        );
        const {token} = await oAuthClientInstance.getToken(code);
        oAuthClientInstance.setCredentials(token);

        const ticket = await oAuthClientInstance.verifyIdToken({
            idToken: token.id_token,
            audience: googleClientId,
        });

        const payload = ticket.getPayload();

        const userProfile = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        };


        const flashToken = jwt.sign(userProfile, process.env.FLASHAUTH_SECRET, {
        expiresIn: "1h",
        });

           return res.send(`
                        <script>
                            window.opener.postMessage(
                            { type: "FLASHAUTH_TOKEN", token: "${flashToken}" },
                            "${creds.frontEndURL}"
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
})

module.exports = router;
