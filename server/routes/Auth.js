const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const AuthProviderSwitcher = require('../middlewares/AuthMiddleware');

router.post('/signin', authController.signin);
router.post('/signup', authController.signup);
router.get('/profile', AuthProviderSwitcher, (req, res)=>{
    res.json({user: req.user});
});

module.exports = router;