const express = require('express');
const router = express.Router();
const admin = require('../controllers/admin.controller');
const report = require('../controllers/report.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// ทุก route ในนี้สำหรับ admin เท่านั้น
router.use(authenticate, requireRole('admin'));

// Admin Dashboard
router.get('/', admin.dashboard);

// รายชื่อผู้ใช้
router.get('/users', admin.getUsers);
router.post('/users/:userId/ban', admin.banUser);
router.post('/users/:userId/unban', admin.unbanUser);
router.get('/users/:userId', admin.getUserDetails);
router.get('/teams', admin.getTeams);
router.get('/teams/:teamId', admin.getTeamDetails);
router.get('/reports', report.adminList);
router.get('/reports/:reportId', report.adminDetails);
router.post('/reports/:reportId/handled', report.markHandled);

module.exports = router;
