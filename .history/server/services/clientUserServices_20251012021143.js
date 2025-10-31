const mongoose = require('mongoose');
const crypto = require('crypto');

const defaultUserSchema = new mongoose.Schema({
    name: {type: String, required: function(){return this.isNew}},
    email: {type: String, required:true, unique: true},
    flashAuthId: {type: String, required: true, unique: true},
    authProvider: {type: String, enum: ["local", "google", "github", "linkedin"], default: "local", required: true},
    passwordHash: {type: String, 
        required: function(){
            return this.authProvider == 'local'
        }
    },
    avatar: {type: String},
    emailVerified: {type: Boolean, default: false},
    passwordResetToken: {type: String},
    passwordResetTokenExpiry: {type: Date},
},{
    timestamps: true
});



const connectionCache = new Map();

async function getClientConnection(uri){
    if(connectionCache.has(uri)) return connectionCache.get(uri);

    try {
        const connection = mongoose.createConnection(uri, {
            maxPoolSize: 5,
            serverSelectionTimeoutMS: 5000
        });

        await connection.asPromise();
        connectionCache.set(uri, connection);
        return connection;
    } catch (error) {
        console.error('Failed to connect to client DB:', error.message);
        return null;
    }
}




async function findOrCreate(clientMongodbUri, userProfile){
    const connection = await getClientConnection(clientMongodbUri);
    if(!connection){
        return null;
    }
    const User = connection.model('user', defaultUserSchema);
    let user = await User.findOne({email: userProfile.email});
    if(userProfile.authProvider === "local"){
        if(user){ // FOR THE CASE , WHEN USER ALREADY EXISTS IN CLINT'S OWN DATABASE
            const resObj = {
                success: false,
                message: "User already exists. Please sign in"
            }
            return resObj;
        }
    }
    if(user) {
       return user;
    }
    const modifiedUser = {
        ...userProfile, flashAuthId: crypto.randomUUID()
    };
    user = await User.create(modifiedUser);
    return user;
}

module.exports = {findOrCreate};