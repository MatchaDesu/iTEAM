const express = require('express');
const router = express.Router();
const application = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth');

// ทุก route ในนี้ต้องล็อกอิน
router.use(authenticate);

router.get('/', application.getMine);

router.post('/:appId/cancel', application.cancelMine);
router.post('/:appId/review', application.review);

module.exports = router;
