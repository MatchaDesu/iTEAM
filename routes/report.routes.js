const express = require('express');
const router = express.Router();
const report = require('../controllers/report.controller');
const { authenticate } = require('../middleware/auth');

router.post('/user', authenticate, report.reportUser);
router.post('/team', authenticate, report.reportTeam);

module.exports = router;
