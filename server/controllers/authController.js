const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const firebaseAdmin = require('../config/firebaseAdmin');
const { generateJWT } = require('../utils/jwtConfig');






// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------
// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------
const SignUpWithJWT = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(401).json({ msg: "Already signed up, Please sign in" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
      provider: 'local'
    });

    await user.save();

    const jwtToken = generateJWT(user);
    return res.json({ token: jwtToken });

  } catch (error) {
    console.error("JWT signup error:", error);
    return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
  }
};

// JWT SIGN IN
const SignInWithJWT = async(req, res)=>{
  const {email, password} = req.body;
  try {
    const user = await User.findOne({email: email});
    if(!user){
      return res.status(401).json({msg: "User doesn't exist. Please sign up"});
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(!isMatch){
      return res.status(401).json({msg: "Incorrect password, Please try again"});
    }
    const token = generateJWT(user);
    const userData = {
      email: user.email, name: user.name
    }
    return res.status(200).json({data: userData, token: token, msg: "Signed in successfully"});

  } catch (error) {
    return res.status(500).json({msg: "INTERNAL SERVER ERROR"});
  }
}
// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------
// --------------------------------------------------- JWT SIGN UP AND SIGN IN---------------------------------------------------------







// ------------------------------------------------ GOOGLE SIGN UP AND SIGN IN---------------------------------------------------------
// ------------------------------------------------ GOOGLE SIGN UP AND SIGN IN---------------------------------------------------------
const SignUpWithGoogle = async (req, res) => {
  const googleToken = req.header('Authorization')?.replace('Bearer google:', '');

  if (!googleToken) {
    return res.status(401).json({ msg: "INVALID AUTHENTICATION TOKEN" });
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(googleToken);
    let user = await User.findOne({ email: decodedToken.email });

    if (user) {
      const jwtToken = generateJWT(user);
      return res.status(200).json({ token: jwtToken, msg: "User already exists. Please sign in." });
    }

    user = new User({
      name: decodedToken.name,
      email: decodedToken.email,
      googleId: decodedToken.uid,
      provider: 'google'
    });

    await user.save();

    const jwtToken = generateJWT(user);
    return res.status(200).json({ token: jwtToken, msg: "Successfully signed up with google." });

  } catch (error) {
    return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
  }
};


// SIGN IN WITH GOOGLE
const SignInWithGoogle = async(req, res)=>{
  const googleToken = req.header('Authorization')?.replace('Bearer google:', '');
  if(!googleToken) {
    return res.status(500).json({msg: "Invalid auth token"});
  }

  try {
    const decodedToken = await firebaseAdmin.auth().verifyIdToken(googleToken);
    const user = await User.findOne({ email: decodedToken.email });
    if (!user) {
      return res.status(404).json({ msg: "User doesn't exist. Please sign up" });
    }
    const jwtToken = generateJWT(user);
    const userData = {name: decodedToken.name, email: decodedToken.email};
    return res.status(200).json({ token: jwtToken, data: userData, msg: "Signed in successfully" });
  } catch (error) {
    return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
  }
}
// ------------------------------------------------ GOOGLE SIGN UP AND SIGN IN---------------------------------------------------------
// ------------------------------------------------ GOOGLE SIGN UP AND SIGN IN---------------------------------------------------------











// SIGN UP CONTROLLER-----------------------------------------------------------------------------------------------------------
exports.signup = [
  async (req, res, next) => {
    if (req.body.provider === 'local') {
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

    const { provider = 'local' } = req.body;

    switch (provider) {
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
    if (req.body.provider === 'local') {
      await Promise.all([
        body('email').isEmail().withMessage('Invalid email format').run(req),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters').run(req),
      ]);
    }
    next();
  },



  
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const {provider} = req.body;
    switch (provider) {
      case 'local':
        return SignInWithJWT(req, res);    
      case 'google':
        return SignInWithGoogle(req, res);
    }
  }
];
//------------------------------------------------------------------------------------------------------------------------------