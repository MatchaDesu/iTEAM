const express = require('express');
const router = express.Router();
const category = require('../controllers/category.controller');

// ดูได้ทุกคน (เพิ่ม/แก้/ลบหมวดหมู่ทำผ่าน SQL โดยตรง)
router.get('/', category.getAll);
router.get('/:categoryId', category.getById);

module.exports = router;