const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Login
router.get('/login', auth.showLogin);
router.post('/login', auth.login);

// Sign up
router.get('/signup', auth.showSignup);
router.post('/signup', auth.register);

// Logout
router.post('/logout', authenticate, auth.logout);

module.exports = router;
