const adminModel = require('../models/adminModel');
const teamModel = require('../models/teamModel');
const teamMemberModel = require('../models/teamMemberModel');
const { parseId } = require('../utils/currentUser');
const PAGE_SIZE = 10;

const requestedPage = (value) => {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? Math.min(page, 1000000) : 1;
};

const loadPage = async (fetchPage, filters, requested) => {
    let result = await fetchPage({ ...filters, limit: PAGE_SIZE, offset: (requested - 1) * PAGE_SIZE });
    const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
    const page = Math.min(requested, totalPages);
    if (page !== requested) {
        result = await fetchPage({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    }
    return { ...result, page, totalPages };
};

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
    if (role !== undefined && !['member', 'admin'].includes(role)) {
        req.flash("role ต้องเป็น 'member' หรือ 'admin'");
        return res.redirect('/admin/users');
    }

    try {
        const q = String(req.query.q || '').trim();
        const result = await loadPage(adminModel.getUsersPage, { role, q }, requestedPage(req.query.page));
        return res.render('admin/users', {
            users: result.users, role, q, currentUserId: req.user.user_id ?? req.user.id,
            pagination: { page: result.page, totalPages: result.totalPages, total: result.total, baseUrl: '/admin/users', filters: { role, q } }
        });
    } catch (err) {
        console.error('admin getUsers error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.getTeams = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const result = await loadPage(teamModel.getAllPage, { q }, requestedPage(req.query.page));
        return res.render('admin/teams', {
            teams: result.teams, q,
            pagination: { page: result.page, totalPages: result.totalPages, total: result.total, baseUrl: '/admin/teams', filters: { q } }
        });
    } catch (err) {
        console.error('admin getTeams error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.getUserDetails = async (req, res) => {
    const userId = parseId(req.params.userId);
    if (!userId) return res.status(400).send('ไม่พบผู้ใช้');
    try {
        const [profileUser, teams] = await Promise.all([
            adminModel.getUserById(userId),
            teamMemberModel.getTeamsByUserId(userId)
        ]);
        if (!profileUser) return res.status(404).send('ไม่พบผู้ใช้');
        return res.render('users/detail_profile', { profileUser, teams, adminReadOnly: true });
    } catch (err) {
        console.error('admin user details error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

const changeUserBan = async (req, res, banned) => {
    const userId = parseId(req.params.userId);
    const returnParams = new URLSearchParams();
    for (const key of ['q', 'role', 'page']) {
        if (req.body?.[key]) returnParams.set(key, req.body[key]);
    }
    const returnQuery = returnParams.toString();
    const returnTo = `/admin/users${returnQuery ? `?${returnQuery}` : ''}`;
    if (!userId) {
        req.flash('ข้อมูลการเปลี่ยนสถานะผู้ใช้ไม่ถูกต้อง');
        return res.redirect(returnTo);
    }
    if (String(userId) === String(req.user.user_id ?? req.user.id)) {
        req.flash('ไม่สามารถแบนบัญชีของตัวเองได้');
        return res.redirect(returnTo);
    }
    try {
        const changed = await adminModel.setMemberBanned(userId, banned);
        req.flash(changed ? (banned ? 'แบนผู้ใช้และปิดทีมของผู้ใช้แล้ว' : 'ปลดแบนผู้ใช้และเปิดทีมของผู้ใช้แล้ว') : 'ไม่พบสมาชิกหรือสถานะเปลี่ยนไปแล้ว');
        return res.redirect(returnTo);
    } catch (err) {
        console.error('admin ban user error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.banUser = (req, res) => changeUserBan(req, res, true);
exports.unbanUser = (req, res) => changeUserBan(req, res, false);

exports.getTeamDetails = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) return res.status(400).send('ไม่พบทีม');
    try {
        const [team, members] = await Promise.all([
            teamModel.getById(teamId),
            teamMemberModel.getMembersByTeamId(teamId)
        ]);
        if (!team) return res.status(404).send('ไม่พบทีม');
        return res.render('teams/detail', {
            team, members, myApplication: null, myApplicationDetails: null,
            isFavorite: false, adminReadOnly: true
        });
    } catch (err) {
        console.error('admin team details error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};
