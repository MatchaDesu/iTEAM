const express = require('express');
const router = express.Router();
const team = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/teams', team.getMyTeams);
router.get('/teams/new', team.newTeamPage);
router.post('/teams/:teamId', team.updateMyTeam);
router.post('/teams/:teamId/members/:memberId/remove', team.removeMember);

module.exports = router;
