const mongoose = require('mongoose');


const UserCredentials = new mongoose.Schema({
    owner: {type: mongoose.Schema.Types.ObjectId, required: true},
    clientFrontEndURL : {type: String, required: true},
    clientPublicKey: { type: String, required: true, unique: true }, 
    clientSecretKey: { type: String, required: true, unique: true},          
    clientMongoDbUri: { type: String, required: true },             // USER'S:  MONGODB URI      
    googleClientId: { type: String, required: true },            // GOOGLE CLIENT ID
    googleClientSecret: { type: String, required: true },       // GOOGLE CLIENT SECRET   
    tokenExpiryDuration: {type: String, required: true, default: '1h'},        // 1h, 2h
    createdAt: { type: Date, default: Date.now },
},{
    collection: 'usercredentials',
    Tim
});

module.exports = {UserCredentials};

