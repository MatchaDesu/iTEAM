const express = require('express');
const router = express.Router();

// All Application from User
router.get('/', (req, res) => {
    res.send('created');
});

// Specified Application from User
router.get('/:appId', (req, res) => {
    res.send(`User ${req.params.appId}`);
});

module.exports = router