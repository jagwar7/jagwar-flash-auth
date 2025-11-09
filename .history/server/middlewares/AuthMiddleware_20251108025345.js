const jwt = require('jsonwebtoken');
const firebaseAdmin = require('../config/firebaseAdmin');





const AuthProviderSwitcher = (req, res, next)=>{
    let token = req.header('Authorization');
    console.log(token)
    if(!token){
        return res.status(401).json({success: false, message: "No token passed on"});
    }
    if(token.startsWith('local:')){
        token = token.replace('local:', '');
        return VerifyJWTToken(req, res, token, next);
    }
    if(token.startsWith('google:')){
        token = token.replace('google:', '');
        return VerifyGoogleToken(req, res, token, next);
    }

    return res.status(401).json({success: false, message: "Unsupported login provider"});
}






// VERIFY FIREBASE TOKEN BEFORE SIGN IN
const VerifyGoogleToken = async (req, res, token ,next)=>{
    try {
        const decodedToken = await firebaseAdmin.auth().verifyToken(token);
        req.user = {
            id: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
            authType: 'google',

        };

        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({msg: "Invalid or Expired sing in credentials"});
    }
}




// VERIFY JWT TOKEN BEFORE SIGN IN
const VerifyJWTToken = (req, res, token, next)=>{
    try{
        const decodeToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if(!decodeToken){
            return res.status(401).json({success: false, message: "Missing token"});
        }
        req.user = {
            id: decodeToken.id,
            email: decodeToken.email,
            name: decodeToken.name,
            authType: 'local'
        };
        console.log(req.user.id);
        next();
    }catch(err){
        
        res.status(401).json({success: false, message: "Invalid token"});
    }
}

module.exports = AuthProviderSwitcher;