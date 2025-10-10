const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');
const PasswordManager = require('../Managers/PasswordManager');

router.post('/signin', (req, res, next) => {
    next();
}, authController.signin);

router.post('/signup', (req, res, next) => {
    next();
}, authController.signup);

router.get('/profile', AuthProviderSwitcher, (req, res) => {
    res.json({ user: req.user });
});

router.post('/password-reset-request', (req, res, next) => {
    next();
}, PasswordManager.RequestPasswordReset);

router.post('/reset-password', (req, res, next) => {
    next();
}, PasswordManager.ResetPassword);

module.exports = router;