const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const firebaseAdmin = require('../config/firebaseAdmin');
const { generateJWT } = require('../utils/jwtConfig');






// SIGN UP WITH EMAIL AND PASSWROD FUNCTION MODULE-----------------------------------------------------------------------------
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
//------------------------------------------------------------------------------------------------------------------------------



// SIGN UP WITH GOOGLE FUNCTION MODULE------------------------------------------------------------------------------------------
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
      return res.status(200).json({ token: jwtToken, msg: "User already exists. Signed in instead." });
    }

    user = new User({
      name: decodedToken.name,
      email: decodedToken.email,
      googleId: decodedToken.uid,
      provider: 'google'
    });

    await user.save();

    const jwtToken = generateJWT(user);
    return res.status(200).json({ token: jwtToken, msg: "New Google user signed up" });

  } catch (error) {
    console.error("Google signup error:", error);
    return res.status(500).json({ msg: "INTERNAL SERVER ERROR" });
  }
};
//------------------------------------------------------------------------------------------------------------------------------







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
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required'),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ msg: "INVALID CREDENTIALS" });

      const isCorrectPassword = await bcrypt.compare(password, user.password);
      if (!isCorrectPassword) return res.status(400).json({ msg: "INCORRECT PASSWORD" });

      const token = generateJWT(user);
      res.json({ token });

    } catch (error) {
      console.error("Sign-in error:", error);
      res.status(500).json({ msg: "SERVER ERROR" });
    }
  }
];
//------------------------------------------------------------------------------------------------------------------------------