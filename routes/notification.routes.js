const express = require('express');
const router = express.Router();
const notification = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/stream', notification.stream);
router.get('/', notification.index);
router.get('/:notificationId/open', notification.open);
router.post('/:notificationId/read', notification.markRead);

module.exports = router;
