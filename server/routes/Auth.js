const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');
const PasswordManager = require('../Managers/PasswordManager');

router.post('/signin', authController.signin);
router.post('/signup', authController.signup);
router.get('/profile', AuthProviderSwitcher, (req, res)=>{
    res.json({user: req.user});
});
router.post('/password-reset-request', PasswordManager.RequestPasswordReset);
router.post('/reset-password', PasswordManager.ResetPassword);

module.exports = router;