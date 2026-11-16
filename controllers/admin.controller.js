const adminModel = require('../models/adminModel');
const teamModel = require('../models/teamModel');
const categoryModel = require('../models/categoryModel');
const { parseId } = require('../utils/currentUser');

// GET /admin
exports.dashboard = async (req, res) => {
    try {
        const stats = await adminModel.getStats();
        return res.render('admin/dashboard', { stats });
    } catch (err) {
        console.error('dashboard error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

// GET /admin/users?role=member|admin
exports.getUsers = async (req, res) => {
    const role = req.query.role || undefined;
    if (role !== undefined && !ROLES.includes(role)) {
        req.flash("role ต้องเป็น 'member' หรือ 'admin'");
        return res.redirect('/admin/users');
    }

    try {
        const users = await adminModel.getUsers(role);
        const q = String(req.query.q || '').trim().toLowerCase();
        const filtered = q ? users.filter(u => [u.username, u.first_name, u.last_name, u.email]
            .some(value => String(value || '').toLowerCase().includes(q))) : users;
        return res.render('admin/users', { users: filtered, role, q });
    } catch (err) {
        console.error('admin getUsers error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.getTeams = async (req, res) => {
    try {
        const [allTeams, categories] = await Promise.all([teamModel.getAll(), categoryModel.getAll()]);
        const q = String(req.query.q || '').trim().toLowerCase();
        const cat = String(req.query.cat || '');
        const teams = allTeams.filter(t => (!q || `${t.team_name} ${t.description}`.toLowerCase().includes(q))
            && (!cat || t.category_name === cat));
        return res.render('admin/teams', { teams, categories, q: req.query.q || '', cat });
    } catch (err) {
        console.error('admin getTeams error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.deleteTeam = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) { req.flash('ทีมไม่ถูกต้อง'); return res.redirect('/admin/teams'); }
    try {
        const { changes } = await teamModel.deleteTeam(teamId);
        req.flash(changes ? 'ลบทีมแล้ว' : 'ไม่พบทีม');
        return res.redirect('/admin/teams');
    } catch (err) {
        console.error('admin deleteTeam error:', err);
        req.flash('ลบทีมไม่สำเร็จ');
        return res.redirect('/admin/teams');
    }
};

exports.updateTeamCategory = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    const rawCategoryId = req.body?.category_id;
    const categoryId = rawCategoryId ? parseId(rawCategoryId) : null;
    if (!teamId || (rawCategoryId && !categoryId)) {
        req.flash('ทีม/หมวดหมู่ไม่ถูกต้อง');
        return res.redirect('/admin/teams');
    }
    try {
        if (categoryId && !(await categoryModel.getById(categoryId))) {
            req.flash('ไม่พบหมวดหมู่ที่ระบุ');
            return res.redirect('/admin/teams');
        }
        const { changes } = await teamModel.updateCategory(teamId, categoryId);
        if (!changes) {
            req.flash('ไม่พบทีม');
            return res.redirect('/admin/teams');
        }
        req.flash('อัปเดตหมวดหมู่ทีมแล้ว');
        return res.redirect('/admin/teams');
    } catch (err) {
        console.error('updateTeamCategory error:', err);
        req.flash('อัปเดตหมวดหมู่ทีมไม่สำเร็จ');
        return res.redirect('/admin/teams');
    }
};
