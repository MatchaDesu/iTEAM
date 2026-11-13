const express = require('express');
const router = express.Router();

// Login
router.get('/login', (req, res) => {
    res.send('login');
});

// Sign up
router.get('/signup', (req, res) => {
    res.send('signup');
});

module.exports = router;