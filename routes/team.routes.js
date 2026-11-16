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

// Redirect legacy team application links to the EJS management page.
router.get('/:teamId/applications', authenticate, (req, res) => {
    res.redirect(`/leader/teams?team=${encodeURIComponent(req.params.teamId)}&tab=appl`);
});

// Team Application Apply (ต้องล็อกอิน)
router.post('/:teamId/apply', authenticate, team.apply);

module.exports = router;
