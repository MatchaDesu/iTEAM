const express = require('express');
const router = express.Router();
const pages = require('../controllers/pages.controller');
const user = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth');
const profileImageUpload = require('../middleware/profileImageUpload');

router.get('/', pages.home);
router.get('/about', pages.about);
router.get('/guide', pages.guide);
router.get('/profile', authenticate, user.getMyProfile);
router.get('/profile/edit', authenticate, user.editMyProfile);
router.post('/profile', authenticate, profileImageUpload, user.updateMyProfile);

module.exports = router;
