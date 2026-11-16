const express = require('express');
const router = express.Router();
const category = require('../controllers/category.controller');
const { authenticate, requireRole } = require('../middleware/auth');

// Actions from admin EJS forms; list page is /admin/categories.
router.post('/', authenticate, requireRole('admin'), category.create);
router.post('/:categoryId/update', authenticate, requireRole('admin'), category.update);
router.post('/:categoryId/delete', authenticate, requireRole('admin'), category.remove);

module.exports = router;
