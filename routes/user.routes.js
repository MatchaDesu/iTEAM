const express = require('express');
const router = express.Router();
const user = require('../controllers/user.controller');

// User Profile
router.get('/:userId', user.getProfile);

module.exports = router;