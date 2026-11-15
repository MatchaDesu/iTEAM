const express = require('express');
const router = express.Router();
const team = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth');

// Explore Teams
router.get('/', team.getAll);

// Create Team (ต้องล็อกอิน)
router.post('/', authenticate, team.create);

// Team Detail
router.get('/:teamId', team.getById);

// Applications ของทีม (leader เท่านั้น)
router.get('/:teamId/applications', authenticate, team.getApplications);

// Team Application Apply (ต้องล็อกอิน)
router.post('/:teamId/apply', authenticate, team.apply);

module.exports = router;