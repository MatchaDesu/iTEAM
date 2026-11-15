const express = require('express');
const router = express.Router();
const application = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth');

// ทุก route ในนี้ต้องล็อกอิน
router.use(authenticate);

// All Application from User
router.get('/', application.getMine);

// Specified Application from User
router.get('/:appId', application.getById);

// Approve / Reject (leader ของทีมเท่านั้น)
router.patch('/:appId', application.review);

module.exports = router;