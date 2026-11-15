const categoryModel = require('../models/categoryModel');
const { parseId } = require('../utils/currentUser');

const MAX_NAME_LENGTH = 100;

const validateName = (value) => {
    const name = typeof value === 'string' ? value.trim() : '';
    if (!name) return { error: 'กรุณากรอก category_name' };
    if (name.length > MAX_NAME_LENGTH) {
        return { error: `category_name ต้องไม่เกิน ${MAX_NAME_LENGTH} ตัวอักษร` };
    }
    return { name };
};

// GET /categories
exports.getAll = async (req, res) => {
    try {
        const categories = await categoryModel.getAll();
        return res.json({ categories });
    } catch (err) {
        console.error('getAll categories error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// GET /categories/:categoryId
exports.getById = async (req, res) => {
    const id = parseId(req.params.categoryId);
    if (!id) {
        return res.status(400).json({ message: 'categoryId ไม่ถูกต้อง' });
    }

    try {
        const category = await categoryModel.getById(id);
        if (!category) {
            return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
        }
        return res.json({ category });
    } catch (err) {
        console.error('getById category error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// POST /categories  (admin)
exports.create = async (req, res) => {
    const { name, error } = validateName(req.body?.category_name);
    if (error) {
        return res.status(400).json({ message: error });
    }

    try {
        const { category_id } = await categoryModel.createCategory(name);
        return res.status(201).json({ message: 'เพิ่มหมวดหมู่สำเร็จ', category_id });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'มีหมวดหมู่นี้อยู่แล้ว' });
        }
        console.error('create category error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// PATCH /categories/:categoryId  (admin)
exports.update = async (req, res) => {
    const id = parseId(req.params.categoryId);
    if (!id) {
        return res.status(400).json({ message: 'categoryId ไม่ถูกต้อง' });
    }

    const { name, error } = validateName(req.body?.category_name);
    if (error) {
        return res.status(400).json({ message: error });
    }

    try {
        const { changes } = await categoryModel.updateCategory(id, name);
        if (!changes) {
            return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
        }
        return res.json({ message: 'แก้ไขหมวดหมู่สำเร็จ' });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'มีหมวดหมู่นี้อยู่แล้ว' });
        }
        console.error('update category error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// DELETE /categories/:categoryId  (admin)
// ทีมที่ใช้หมวดนี้จะถูกตั้ง category_id เป็น NULL (ON DELETE SET NULL)
exports.remove = async (req, res) => {
    const id = parseId(req.params.categoryId);
    if (!id) {
        return res.status(400).json({ message: 'categoryId ไม่ถูกต้อง' });
    }

    try {
        const { changes } = await categoryModel.deleteCategory(id);
        if (!changes) {
            return res.status(404).json({ message: 'ไม่พบหมวดหมู่' });
        }
        return res.json({ message: 'ลบหมวดหมู่สำเร็จ' });
    } catch (err) {
        console.error('delete category error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};