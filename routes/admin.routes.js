const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// ทุก route ในนี้สำหรับ admin เท่านั้น
router.use(authenticate, requireRole('admin'));

// Admin Dashboard
router.get('/', admin.dashboard);

// รายชื่อผู้ใช้
router.get('/users', admin.getUsers);
router.get('/teams', admin.getTeams);
router.post('/teams/:teamId/delete', admin.deleteTeam);
router.post('/teams/:teamId/category', admin.updateTeamCategory);

module.exports = router;
