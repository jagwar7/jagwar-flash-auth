const mongoose = require('mongoose');


const UserCredentials = new mongoose.Schema({
    clientPublicKey: { type: String, required: true, unique: true }, 
    clientSecret: { type: String, required: true },          
    firebaseAPIkey: { type: String, required: true },       // FIREBASE API KEY
    firebaseAuthDomain: { type: String, required: true },   // FIREBASE AUTH DOMAIN
    firebaseProjectID: { type: String, required: true },    // FIREBASE PROJECT ID
    firebaseAppID: { type: String, required: true },        // FIREBASE APP ID
    redirectUri: { type: String, required: true },           
    mongoUri: { type: String, required: true },            // USER'S:  MONGODB URI      
    googleClientId: { type: String, required: true },   // GOOGLE CLIENT ID
    googleClientSecret: { type: String, required: true }, // GOOGLE CLIENT SECRET        
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserCredentials', UserCredentials);

// clientid: 46763810748-e0cis8m2t3o7jnc1r3af486887f3u7pk.apps.googleusercontent.com
// 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
// https://flashauth-test.firebaseapp.com/__/auth/handler