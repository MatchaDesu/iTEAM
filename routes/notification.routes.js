const express = require('express');
const router = express.Router();
const notification = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', notification.index);
router.post('/:notificationId/read', notification.markRead);

module.exports = router;
