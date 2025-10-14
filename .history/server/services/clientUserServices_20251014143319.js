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
    emailVerified: {type: Boolean, default: function(){return this.authProvider == "google"}},
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
        const resObj = {
            success: false,
            message: "INTERNAL SERVER ERROR: Setting up connection, Contact Admin"
        }
        return resObj;
    }

    // TRY CREATING USER-------------------------------------
    const User = connection.model('user', defaultUserSchema);
    let user = await User.findOne({email: userProfile.email});

    if(user) {
        if(userProfile.authProvider === "local"){
            
            const resObj = {
                success: false,
                message: "User already exists. Please sign in"
            }
            return resObj;
        }
        const resObj = {
            success: true,
            data: user
        }
       return resObj;
    }
    const modifiedUser = {
        ...userProfile, flashAuthId: crypto.randomUUID()
    };
    
    // CREATE NEW USER IF DOESNT EXIST 
    user = await User.create(modifiedUser);
    const resObj = {
        success: true,
        message: "Successfully signed up",
        data: user
    }
    return resObj;
}


async function TryLocalSignin(clientMongodbUri, userProfile){
    const connection = await getClientConnection(clientMongodbUri); // connectto mongondb database
    const resObj = {
        success: undefined,
        message: undefined
    }
    if(!connection) {
        resObj.success
        return resObj;
    }

    const userColletions = connection.model('user', defaultUserSchema);
    const user = userColletions.findOne({email: userProfile.email});
    if(!user){
        const resObj = {
            success: false,
            message: "CLIENT ERROR: User doesnt exist, Please sign up"
        }
        return resObj;
    }

    if(user && user.authProvider !== "local"){
        const resOb
    }
    


}

module.exports = {findOrCreate};