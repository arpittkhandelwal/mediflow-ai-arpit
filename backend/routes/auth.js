const express = require('express');
const router = express.Router();
const { signup, login, logout, refreshToken, getMe } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { signupValidator, loginValidator, validateRequest } = require('../middlewares/validation');

router.post('/signup', signupValidator, validateRequest, signup);
router.post('/login',  loginValidator,  validateRequest, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.get('/me', authenticate, getMe);

module.exports = router;
