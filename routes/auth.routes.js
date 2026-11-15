const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth');

// Login
router.post('/login', auth.login);

// Sign up
router.post('/signup', auth.register);

// Logout
router.post('/logout', authenticate, auth.logout);

// Current user
router.get('/me', authenticate, auth.me);

module.exports = router;