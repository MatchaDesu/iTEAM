const express = require('express');
const router = express.Router();
const auth = require('../controllers/auth.controller');

// Login
router.post('/login', auth.login);

// Sign up
router.post('/signup', auth.register);

module.exports = router;