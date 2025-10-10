const bcrypt = require('bcryptjs');
const { userSchema } = require('../models/User.model');
const { body, validationResult } = require('express-validator');
const firebaseAdmin = require('../config/firebaseAdmin');
const { generateJWT } = require('../utils/jwtConfig');

// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------
const SignUpWithJWT = async (req, res) => {
    console.log("JWT SIGN UP FUNCTION CALLED at", new Date().toISOString());
    const startTime = Date.now();
    const { name, email, password } = req.body;

    try {
        console.log(`🔍 Entering SignUpWithJWT for ${email} at ${new Date().toISOString()}`);
        const User = req.db.model('User', userSchema);
        console.log(`🔍 Finding user with email: ${email} at ${new Date().toISOString()}`);
        let user = await User.findOne({ email }).lean().exec();
        console.log(`🔍 User find took ${Date.now() - startTime}ms, user: ${user ? 'found' : 'not found'}`);
        if (user) {
            console.log(`🚫 User ${email} already exists at ${new Date().toISOString()}`);
            return res.status(401).json({ msg: "Already signed up, Please sign in" });
        }
        console.log(`🔒 Hashing password for ${email} at ${new Date().toISOString()}`);
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(`🔒 Password hashed in ${Date.now() - startTime}ms`);
        
        user = new User({
            name,
            email,
            password: hashedPassword,
            authType: 'local'
        });
        console.log(`💾 Saving user ${email} at ${new Date().toISOString()}`);
        await user.save();
        console.log(`💾 User ${email} saved in ${Date.now() - startTime}ms`);

        console.log(`🔑 Generating JWT for ${email} at ${new Date().toISOString()}`);
        const jwtToken = generateJWT(user);
        console.log(`🔑 JWT generated in ${Date.now() - startTime}ms total`);
        return res.json({ token: jwtToken });
    } catch (error) {
        console.error("JWT signup error:", error.message, error.stack, new Date().toISOString());
        return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
    }
};

const SignInWithJWT = async (req, res) => {
    const startTime = Date.now();
    const { email, password } = req.body;

    try {
        const User = req.db.model('User', userSchema);
        const user = await User.findOne({ email }).lean().exec();
        if (!user) {
            return res.status(401).json({ msg: "User doesn't exist. Please sign up" });
        }
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ msg: "Incorrect password, Please try again" });
        }
        console.log(`🔑 Generating JWT for ${email} at ${new Date().toISOString()}`);
        const token = generateJWT(user);
        console.log(`🔑 JWT generated in ${Date.now() - startTime}ms`);
        const userData = {
            email: user.email,
            name: user.name,
            authType: user.authType
        };
        console.log(`✅ Prepared response for ${email} in ${Date.now() - startTime}ms total`);
        return res.status(200).json({ data: userData, token, msg: "Signed in successfully" });
    } catch (error) {
        console.error("JWT signin error:", error.message, error.stack, new Date().toISOString());
        return res.status(500).json({ msg: "INTERNAL SERVER ERROR, check logs" });
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
                return res.status(400).json({ msg: "Invalid Auth Provider" });
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
        return SignInWithJWT(req, res);
    }
];
//------------------------------------------------------------------------------------------------------------------------------