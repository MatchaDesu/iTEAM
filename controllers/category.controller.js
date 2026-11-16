const categoryModel = require('../models/categoryModel');
const { parseId } = require('../utils/currentUser');

const validateName = (value) => {
    const name = typeof value === 'string' ? value.trim() : '';
    if (!name) return { error: 'กรุณากรอกชื่อหมวดหมู่' };
    if (name.length > 100) return { error: 'ชื่อหมวดหมู่ต้องไม่เกิน 100 ตัวอักษร' };
    return { name };
};

exports.create = async (req, res) => {
    const { name, error } = validateName(req.body?.category_name);
    if (error) {
        req.flash(error);
        return res.redirect('/admin/categories');
    }
    try {
        await categoryModel.createCategory(name);
        req.flash('เพิ่มหมวดหมู่แล้ว');
    } catch (err) {
        console.error('create category error:', err);
        req.flash(err.code === '23505' ? 'มีหมวดหมู่นี้แล้ว' : 'เพิ่มหมวดหมู่ไม่สำเร็จ');
    }
    return res.redirect('/admin/categories');
};

exports.update = async (req, res) => {
    const id = parseId(req.params.categoryId);
    const { name, error } = validateName(req.body?.category_name);
    if (!id || error) {
        req.flash(error || 'หมวดหมู่ไม่ถูกต้อง');
        return res.redirect('/admin/categories');
    }
    try {
        const { changes } = await categoryModel.updateCategory(id, name);
        req.flash(changes ? 'แก้ไขหมวดหมู่แล้ว' : 'ไม่พบหมวดหมู่');
    } catch (err) {
        console.error('update category error:', err);
        req.flash(err.code === '23505' ? 'มีหมวดหมู่นี้แล้ว' : 'แก้ไขหมวดหมู่ไม่สำเร็จ');
    }
    return res.redirect('/admin/categories');
};

exports.remove = async (req, res) => {
    const id = parseId(req.params.categoryId);
    if (!id) {
        req.flash('หมวดหมู่ไม่ถูกต้อง');
        return res.redirect('/admin/categories');
    }
    try {
        const { changes } = await categoryModel.deleteCategory(id);
        req.flash(changes ? 'ลบหมวดหมู่แล้ว' : 'ไม่พบหมวดหมู่');
    } catch (err) {
        console.error('delete category error:', err);
        req.flash('ลบหมวดหมู่ไม่สำเร็จ');
    }
    return res.redirect('/admin/categories');
};
