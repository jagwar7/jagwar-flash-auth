const express = require('express');
const router = express.Router();
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');
const UserCredentials = require('../models/UserCredentials.model.js');

// IT WILL BE CALLED WHEN FORM OPENS TO SUBMIT AND WILL BE FETCHED AND FORM DATA WILL BE FILLED
router.get('/get', AuthProviderSwitcher, async(req, res)=>{
    try {
        const creds = await UserCredentials.findOne({userId: req.user.id});
        if(!creds){
            return res.status(404).json({error: "No credentials found, Please add your credentials."});
        }
        res.status(200).json({credentials: creds});
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
        const {
            clientPublicKey,
            clientSecret,
            firebaseAPIkey,
            firebaseAuthDomain,
            firebaseProjectID,
            firebaseAppID,
            redirectUri,
            mongoUri
            } = req.body;

        if (
            !clientPublicKey ||
            !clientSecret ||
            !firebaseAPIkey ||
            !firebaseAuthDomain ||
            !firebaseProjectID ||
            !firebaseAppID ||
            !redirectUri ||
            !mongoUri
        ) {
            return res.status(400).json({ msg: "All fields are required" });
        }
        let creds = await UserCredentials.findOne({userId: req.user.id});
        if(!creds){
            creds = new UserCredentials({
                userId: req.user.id,
                clientPublicKey,
                clientSecret,
                firebaseAPIkey,
                firebaseAuthDomain,
                firebaseProjectID,
                firebaseAppID,
                redirectUri,
                mongoUri
            });
        } else {
            Object.assign(creds, {
                clientPublicKey,
                clientSecret,
                firebaseAPIkey,
                firebaseAuthDomain,
                firebaseProjectID,
                firebaseAppID,
                redirectUri,
                mongoUri
            });
        }
        await creds.save();
        res.status(200).json({msg: "Credentials updated successfully", credentials: creds});
    } catch (error) {
        console.error("Error updating credentials:", error);
        return res.status(500).json({error: "Error updating credentials"});
    }
})

module.exports = router;
