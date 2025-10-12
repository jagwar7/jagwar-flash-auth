// routes/UserCredentials.js
const express = require('express');
const router = express.Router();
const UserCredentials = require('../models/UserCredentials.model');
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');


router.put('/', AuthProviderSwitcher, async (req, res) => {
    try {
        const { clientId, clientSecret, redirectUri, mongoUri, googleClientId, googleClientSecret } = req.body;

        // FIND LATEST CREDENTAILS OF USER(DEVELOPER)
        let creds = await UserCredentials.findOne({ userId: req.user.id });

        if (!creds) {
            // First-time creation: all required fields must be present
            if (!clientId || !clientSecret || !redirectUri || !mongoUri || !googleClientId || !googleClientSecret) {
                return res.status(400).json({ error: "All credentials fields are required for first-time setup" });
            }

            creds = new UserCredentials({
                userId: req.user.id,
                clientId,
                clientSecret,
                redirectUri,
                mongoUri,
                googleClientId,
                googleClientSecret
            });
        } else {
            // Partial update allowed: only clientId and clientSecret can be changed
            if (!clientId || !clientSecret) {
                return res.status(400).json({ error: "clientId and clientSecret are required for update" });
            }

            creds.clientId = clientId;
            creds.clientSecret = clientSecret;
        }

        await creds.save();

        res.json({ message: "Credentials saved successfully", creds });
    } catch (err) {
        console.error("Update credentials error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});


module.exports = router;
