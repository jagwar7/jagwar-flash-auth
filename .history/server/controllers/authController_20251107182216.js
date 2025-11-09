const bcrypt = require('bcryptjs');
const { userSchema } = require('../models/User.model');
const { body, validationResult } = require('express-validator');
const firebaseAdmin = require('../config/firebaseAdmin');
const { generateJWT } = require('../utils/jwtConfig');


const resObj = {
    success: undefined,
    data: undefined,
    message: undefined
}

// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------
const SignUpWithJWT = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const User = req.db.model('User', userSchema);
        let user = await User.findOne({ email }).lean().exec();
        if (user) {
            resObj.success = false;
            resObj.data = null;
            resObj.message = "User already exists, Please sign in";

            return res.status(401).json(resObj);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        user = new User({
            name,
            email,
            password: hashedPassword,
            authType: 'local'
        });

        await user.save();
        const jwtToken = generateJWT(userObj);

        
        resObj.success = true;
        resObj.message = "Successfully signed up";
        resObj.data = jwtToken;
        return res.status(200).json(resObj);
    } catch (error) {
        resObj.success = false;
        resObj.data = null;
        resObj.message = "INTERNAL SERVER ERROR: Contact Admin";
        return res.status(500).json(resObj);
    }
};

const SignInWithJWT = async (req, res) => {
    const { email, password } = req.body;

    try {
        const User = req.db.model('User', userSchema);
        const user = await User.findOne({ email }).lean().exec();
        if (!user) {
            resObj.success = false;
            resObj.message = "CLIENT ERROR: User doesn't exist. Please sign up";
            resObj.data = null;
            return res.status(401).json(resObj);
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            resObj.success = false;
            resObj.data = null;
            resObj.message = "CLIENT ERROR: Incorrect password, Please try again";
            return res.status(401).json(resObj);
        }

        const userData = {
            id: user._id,
            email: user.email,
            name: user.name,
            authType: user.authType
        };
        const token = generateJWT(userData);

        resObj.success = true;
        resObj.message = "Signed in successfully";
        resObj.data = token;
        return res.status(200).json(resObj);
    } catch (error) {
        resObj.success = false;
        resObj.data = null;
        resObj.message = "INTERNAL SERVER ERROR: Contact Admin";
        return res.status(500).json(resObj);
    }
    
};
// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------






// ------------------------------------------------ GOOGLE SIGN UP AND SIGN IN---------------------------------------------------------
const SignUpWithGoogle = async (req, res) => {
    const googleToken = req.header('Authorization')?.replace('Bearer google:', '');

    if (!googleToken) {
        return res.status(401).json({ msg: "INVALID AUTHENTICATION TOKEN" });
    }

    try {
        const User = req.db.model('User', userSchema);
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(googleToken);
        let user = await User.findOne({ email: decodedToken.email }).lean().exec();

        if (user) {
            const jwtToken = generateJWT(user);
            return res.status(200).json({ token: jwtToken, msg: "User already exists. Please sign in." });
        }
        
        user = new User({
            name: decodedToken.name,
            email: decodedToken.email,
            googleId: decodedToken.uid,
            authType: 'google'
        });
        await user.save();

        const jwtToken = generateJWT(user);
        return res.status(200).json({ token: jwtToken, msg: "Successfully signed up with google." });
    } catch (error) {
        return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
    }
};

const SignInWithGoogle = async (req, res) => {
    const googleToken = req.header('Authorization')?.replace('Bearer google:', '');

    if (!googleToken) {
        return res.status(500).json({ msg: "Invalid auth token" });
    }

    try {
        const User = req.db.model('User', userSchema);
        const decodedToken = await firebaseAdmin.auth().verifyIdToken(googleToken);
        const user = await User.findOne({ email: decodedToken.email }).lean().exec();

        if (!user) {
            return res.status(404).json({ msg: "User doesn't exist. Please sign up" });
        }
        const jwtToken = generateJWT(user);
        const userData = { name: decodedToken.name, email: decodedToken.email };

        return res.status(200).json({ token: jwtToken, data: userData, msg: "Signed in successfully" });
    } catch (error) {
        return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
    }
};
// ------------------------------------------------ GOOGLE SIGN UP AND SIGN IN---------------------------------------------------------






// SIGN UP CONTROLLER-----------------------------------------------------------------------------------------------------------
exports.signup = [
    async (req, res, next) => {
        if (req.body.authType === 'local') {
            await Promise.all([
                body('email').isEmail().withMessage('Invalid email format').run(req),
                body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req),
            ]);
        }
        next();
    },
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { authType = 'local' } = req.body;
        switch (authType) {
            case 'local':
                return SignUpWithJWT(req, res);
            case 'google':
                return SignUpWithGoogle(req, res);
            default:
                return res.status(400).json({ msg: "INTERNAL SERVER ERROR: Invalid auth provider" });
        }
    }
];
//------------------------------------------------------------------------------------------------------------------------------






// SIGN IN CONTROLLER ----------------------------------------------------------------------------------------------------------
exports.signin = [
    async (req, res, next) => {
        if (req.body.authType === 'local') {
            await Promise.all([
                body('email').isEmail().withMessage('Invalid email format').run(req),
                body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req),
            ]);
        }
        next();
    },
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const{authType = 'local'} = req.body;
        switch(authType){
            case "local":
                return SignInWithJWT(req, res);
            case "google":
                return SignInWithGoogle(req, res);
            default:
                return res.status(500).json({msg: "INTERNAL SERVER ERROR: Invalid auth provider"});
        }
    }
];
//------------------------------------------------------------------------------------------------------------------------------