const adminModel = require('../models/adminModel');
const teamModel = require('../models/teamModel');
const categoryModel = require('../models/categoryModel');
const { parseId } = require('../utils/currentUser');

const ROLES = ['member', 'admin'];

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

exports.getCategories = async (req, res) => {
    try {
        const categories = await categoryModel.getAll();
        return res.render('admin/categories', { categories });
    } catch (err) {
        console.error('admin getCategories error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.updateRole = async (req, res) => {
    const targetId = parseId(req.params.userId);
    const role = req.body?.role;

    if (!targetId) {
        req.flash('ผู้ใช้ไม่ถูกต้อง');
        return res.redirect('/admin/users');
    }
    if (!ROLES.includes(role)) {
        req.flash('บทบาทไม่ถูกต้อง');
        return res.redirect('/admin/users');
    }
    // กัน admin ลดสิทธิ์ตัวเองจนระบบไม่เหลือ admin
    if (targetId === req.user.user_id) {
        req.flash('ไม่สามารถเปลี่ยนบทบาทของตัวเองได้');
        return res.redirect('/admin/users');
    }

    try {
        const { changes } = await adminModel.setUserRole(targetId, role);
        if (!changes) {
            req.flash('ไม่พบผู้ใช้');
            return res.redirect('/admin/users');
        }
        req.flash('เปลี่ยนบทบาทสำเร็จ');
        return res.redirect('/admin/users');
    } catch (err) {
        console.error('updateRole error:', err);
        req.flash('เปลี่ยนบทบาทไม่สำเร็จ');
        return res.redirect('/admin/users');
    }
};
