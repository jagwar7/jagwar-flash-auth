import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { ResponseData } from '../utils/ResponseData.ts';

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
    role:{type: String, enum:["user", "admin"], default: "user", required: true, lowercase: true, trim: true},
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



// FIND OR CREAETE USER IN CLITNT'S DB
async function findOrCreate(clientMongodbUri, userProfile){
    const connection = await getClientConnection(clientMongodbUri);
    // #1. CHECK IF USER DATA CONNECTION IS ESTABLISHED?
    if(!connection){
        return new ResponseData(false, null, "INTERNAL SERVER ERROR: Failed to connect with Database, Contact Admin", 501);
    }
    if(connection.models['user']) delete connection.models['user'];



    // #2. TRY CREATING USER-------------------------------------
    const User = connection.model('user', defaultUserSchema);
    let user = await User.findOne({email: userProfile.email});

    if(user) {
        if(userProfile.authProvider === "local"){
            return new ResponseData(false, null, "User already exists. Please sign in", 401);
        }
       return new ResponseData(true, user, "Successfully signed in", 200);
    }
    const modifiedUser = {
        ...userProfile,
        role: "user",
        flashAuthId: crypto.randomUUID()
    };
    
    // CREATE NEW USER IF DOESNT EXIST 
    const newUser = new User(modifiedUser);
    user = await newUser.save();
    
    const savedUser = user.toObject();
    console.log(`user role, while creating: ${savedUser.role}`) // <----- ERROR.. NEED TO BE FIXED...
    return new ResponseData(true, user, "Successfully signed up", 200);
}






// TRY JWT SIGN IN ---------------------------------------------------------------------------------------------------
async function TryLocalSignin(clientMongodbUri, userProfile){
    const connection = await getClientConnection(clientMongodbUri); // connectto mongondb database
    const resObj = {
        success: undefined,
        message: undefined,
        data: undefined
    }
    if(!connection) {
        resObj.success = false;
        resObj.message = "INTERNAL SERVER ERROR: Connection to site's database is failed, Contact Admin"
        resObj.data = null;
        return resObj;
    }

    const userColletions = connection.model('user', defaultUserSchema);
    const user = await userColletions.findOne({email: userProfile.email});
    if(!user){
        resObj.success = false;
        resObj.message = "CLIENT SIDE ERROR: User does not exist, Please sign up";
        resObj.data = null;
        return resObj;
    }

    if(user && user.authProvider != "local"){
        resObj.success = false;
        resObj.message = "CLIENT SIDE ERROR: You have signed up with Google Or Github."
        resObj.data = null;
        return resObj;
    }
    
    const isPasswordMatched = bcrypt.compare(userProfile.password, user.passwordHash);
    if(!isPasswordMatched){
        resObj.success = false;
        resObj.message = "CLIENT SIDE ERROR: Incorrect Password";
        resObj.data = null;
        return resObj;
    }

    resObj.success = true;
    resObj.message = "Sign in successfull";
    resObj.data = user;

    return  resObj;
}
//-------------------------------------------------------------------------------------------------------------------





// FETCH USER PROFILE -----------------------------------------------------------------------------------------------
async function FetchProfile(clientMongoDbUri, userProfile){
    const connection = await getClientConnection(clientMongoDbUri);
    const resObj = {
        success: undefined,
        message: undefined,
        data:    undefined
    }
    
    if(!connection){
        resObj.success = false;
        resObj.message = "INTERNAL SERVER ERROR: Faild to connect database, Contact Admin";
        resObj.data = null
        return resObj;
    }

    if(!userProfile.email){
        resObj.success = false;
        resObj.message = "CLIENT ERROR: Invalid user token, Please sign in";
        resObj.data = null;
        return resObj;
    }

    const userColletions = connection.model('user', defaultUserSchema);
    const user = await userColletions.findOne({email: userProfile.email});

    if(!user){
        resObj.success = false;
        resObj.message = "CLIENT ERROR: User does not exist, Please sign up";
        resObj.data = null;
        return resObj;
    }

    resObj.success = true;
    resObj.message = "Successfully fetched user profile";
    resObj.data = user;
    return resObj;
}
export {findOrCreate, TryLocalSignin, FetchProfile};