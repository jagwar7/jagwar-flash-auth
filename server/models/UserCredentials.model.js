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
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('UserCredentials', UserCredentials);
