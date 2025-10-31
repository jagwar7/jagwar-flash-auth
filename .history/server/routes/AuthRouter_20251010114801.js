const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');
const PasswordManager = require('../Managers/PasswordManager');

router.post('/signin', (req, res, next) => {
    next();
}, authController.signin);

router.post('/signup', (req, res, next) => {
    console.log(`🚦 Routing /signup to controller at ${new Date().toISOString()}`);
    next();
}, authController.signup);

router.get('/profile', AuthProviderSwitcher, (req, res) => {
    console.log(`🚦 Routing /profile at ${new Date().toISOString()}`);
    res.json({ user: req.user });
});

router.post('/password-reset-request', (req, res, next) => {
    console.log(`🚦 Routing /password-reset-request at ${new Date().toISOString()}`);
    next();
}, PasswordManager.RequestPasswordReset);

router.post('/reset-password', (req, res, next) => {
    console.log(`🚦 Routing /reset-password at ${new Date().toISOString()}`);
    next();
}, PasswordManager.ResetPassword);

module.exports = router;