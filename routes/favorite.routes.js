const express = require('express');
const router = express.Router();
const favorite = require('../controllers/favorite.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', favorite.index);
router.post('/:teamId/save', favorite.save);
router.post('/:teamId/remove', favorite.remove);

module.exports = router;
