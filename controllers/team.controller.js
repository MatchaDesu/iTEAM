const teamModel = require('../models/teamModel');
const teamMemberModel = require('../models/teamMemberModel');
const applicationModel = require('../models/applicationModel');
const categoryModel = require('../models/categoryModel');
const userModel = require('../models/userModel');
const favoriteModel = require('../models/favoriteModel');
const { isTeamLeader } = require('../utils/teamAccess');
const { parseId } = require('../utils/currentUser');
const PAGE_SIZE = 10;

const requestedPage = (value) => {
    const page = Number(value);
    return Number.isInteger(page) && page > 0 ? Math.min(page, 1000000) : 1;
};

const loadPage = async (filters, requested) => {
    let result = await teamModel.getAllPage({ ...filters, limit: PAGE_SIZE, offset: (requested - 1) * PAGE_SIZE });
    const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
    const page = Math.min(requested, totalPages);
    if (page !== requested) {
        result = await teamModel.getAllPage({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
    }
    return { ...result, page, totalPages };
};

// GET /teams
exports.getAll = async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        const cat = String(req.query.cat || '');
        const result = await loadPage({ q, categoryId: cat }, requestedPage(req.query.page));
        const [categories, favoriteTeamIds] = await Promise.all([
            categoryModel.getAll(),
            req.user ? favoriteModel.getTeamIdsByUserId(req.user.user_id) : Promise.resolve([])
        ]);
        return res.render('teams/explore', {
            teams: result.teams, categories, favoriteTeamIds, q, cat,
            pagination: { page: result.page, totalPages: result.totalPages, total: result.total, baseUrl: '/teams', filters: { q, cat } }
        });
    } catch (err) {
        console.error('getAll teams error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};
// GET /teams/:teamId
exports.getById = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) {
        return res.status(400).send('ไม่พบทีม');
    }

    try {
        const team = await teamModel.getById(teamId);
        if (!team) {
            return res.status(404).send('ไม่พบทีม');
        }

        const members = await teamMemberModel.getMembersByTeamId(teamId);
        const myApplicationDetails = req.user
            ? await applicationModel.getLatestByUserAndTeam(req.user.user_id, teamId)
            : null;
        const myApplication = myApplicationDetails?.status === 'pending' ? myApplicationDetails : null;
        const isFavorite = req.user
            ? await favoriteModel.isFavorite(req.user.user_id, teamId)
            : false;
        return res.render('teams/detail', { team, members, myApplication, myApplicationDetails, isFavorite });
    } catch (err) {
        console.error('getById team error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

// GET /teams/:teamId/apply
exports.newApplicationPage = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) return res.status(400).send('ไม่พบทีม');

    try {
        const team = await teamModel.getById(teamId);
        if (!team) return res.status(404).send('ไม่พบทีม');

        if (team.status !== 'open' || Number(team.member_count) >= Number(team.max_members)) {
            req.flash(team.status !== 'open' ? 'ทีมนี้ปิดรับสมัครแล้ว' : 'ทีมนี้มีสมาชิกครบแล้ว');
            return res.redirect(`/teams/${teamId}`);
        }

        const [membership, pendingApplication] = await Promise.all([
            teamMemberModel.checkMember(teamId, req.user.user_id),
            applicationModel.checkPendingApplication(req.user.user_id, teamId)
        ]);
        if (membership) {
            req.flash('คุณเป็นสมาชิกของทีมนี้อยู่แล้ว');
            return res.redirect(`/teams/${teamId}`);
        }
        if (pendingApplication) {
            req.flash('คุณมีคำขอที่รอพิจารณาในทีมนี้อยู่แล้ว');
            return res.redirect(`/teams/${teamId}`);
        }

        const members = await teamMemberModel.getMembersByTeamId(teamId);
        return res.render('teams/applyteam', { team, members });
    } catch (err) {
        console.error('newApplicationPage error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

// POST /teams/:teamId/apply
exports.apply = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    const userId = req.user?.user_id;
    const message = req.body?.message?.trim() || null;
    const fail = (message) => {
        req.flash(message);
        return res.redirect(teamId ? `/teams/${teamId}/apply` : '/teams');
    };

    if (!teamId) {
        return fail('ทีมไม่ถูกต้อง');
    }
    if (!userId) {
        return fail('กรุณาเข้าสู่ระบบก่อน');
    }

    try {
        const team = await teamModel.getById(teamId);
        if (!team) {
            return fail('ไม่พบทีม');
        }

        if (team.status !== 'open') {
            return fail('ทีมนี้ปิดรับสมัครแล้ว');
        }
        if (Number(team.member_count) >= Number(team.max_members)) {
            return fail('ทีมนี้มีสมาชิกครบแล้ว');
        }

        if (await teamMemberModel.checkMember(teamId, userId)) {
            return fail('คุณเป็นสมาชิกของทีมนี้อยู่แล้ว');
        }

        if (await applicationModel.checkPendingApplication(userId, teamId)) {
            return fail('คุณมีคำขอที่รออนุมัติในทีมนี้อยู่แล้ว');
        }

        await applicationModel.createApplication({
            user_id: userId,
            team_id: teamId,
            message
        });

        req.flash('ส่งคำขอเข้าทีมสำเร็จ');
        return res.redirect(`/teams/${teamId}`);
    } catch (err) {
        if (err.code === 'TEAM_NOT_FOUND') return fail('ไม่พบทีม');
        if (err.code === 'TEAM_CLOSED') return fail('ทีมนี้ปิดรับสมัครแล้ว');
        if (err.code === 'TEAM_FULL') return fail('ทีมนี้มีสมาชิกครบแล้ว');
        if (err.code === 'ALREADY_MEMBER') return fail('คุณเป็นสมาชิกของทีมนี้อยู่แล้ว');
        // unique_pending_application: กรณีส่งคำขอซ้ำพร้อมกัน
        if (err.code === '23505') {
            return fail('คุณมีคำขอที่รออนุมัติในทีมนี้อยู่แล้ว');
        }
        // foreign_key_violation: user_id ไม่มีอยู่จริง
        if (err.code === '23503') {
            return fail('ไม่พบผู้ใช้');
        }
        console.error('apply error:', err);
        return fail('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

// POST /teams  (ต้องล็อกอิน คนสร้างจะเป็น leader ของทีม)
exports.create = async (req, res) => {
    const userId = req.user?.user_id;
    const { team_name, description, category_id } = req.body || {};
    const maxMembers = Number(req.body?.max_members || 5);
    const roles = typeof req.body?.roles === 'string'
        ? [...new Set(req.body.roles.split(',').map(role => role.trim()).filter(Boolean))]
        : [];
    let initialMembers;
    try {
        initialMembers = JSON.parse(req.body?.initial_members || '[]');
    } catch {
        req.flash('รายชื่อสมาชิกเริ่มต้นไม่ถูกต้อง');
        return res.redirect('/leader/teams/new');
    }

    if (typeof team_name !== 'string' || !team_name.trim()
        || typeof description !== 'string' || !description.trim()) {
        req.flash('กรุณากรอกชื่อทีมและรายละเอียด');
        return res.redirect('/leader/teams/new');
    }
    if (team_name.trim().length > 100) {
        req.flash('ชื่อทีมต้องไม่เกิน 100 ตัวอักษร');
        return res.redirect('/leader/teams/new');
    }
    if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 50) {
        req.flash('จำนวนสมาชิกต้องอยู่ระหว่าง 2 ถึง 50 คน');
        return res.redirect('/leader/teams/new');
    }
    if (!Array.isArray(initialMembers) || initialMembers.some(member => member?.type !== 'registered')) {
        req.flash('รายชื่อสมาชิกเริ่มต้นไม่ถูกต้อง');
        return res.redirect('/leader/teams/new');
    }
    const initialMemberIds = initialMembers.map(member => parseId(member.user_id));
    if (initialMemberIds.some(id => !id)
        || new Set(initialMemberIds).size !== initialMemberIds.length
        || initialMemberIds.includes(Number(userId))) {
        req.flash('รายชื่อสมาชิกเริ่มต้นซ้ำหรือไม่ถูกต้อง');
        return res.redirect('/leader/teams/new');
    }
    if (initialMemberIds.length + 1 > maxMembers) {
        req.flash('จำนวนสมาชิกเริ่มต้นเกินจำนวนสูงสุดของทีม');
        return res.redirect('/leader/teams/new');
    }

    try {
        let categoryId = null;
        if (category_id !== undefined && category_id !== null && category_id !== '') {
            categoryId = parseId(category_id);
            if (!categoryId || !(await categoryModel.getById(categoryId))) {
                req.flash('ไม่พบหมวดหมู่ที่ระบุ');
                return res.redirect('/leader/teams/new');
            }
        }

        const { team_id } = await teamModel.createTeamWithLeader({
            team_name: team_name.trim(),
            description: description.trim(),
            category_id: categoryId,
            max_members: maxMembers,
            roles,
            initial_members: initialMemberIds,
            created_by: userId
        });

        req.flash('สร้างทีมสำเร็จ');
        return res.redirect(`/leader/teams?team=${team_id}`);
    } catch (err) {
        if (err.code === 'INVALID_INITIAL_MEMBERS') {
            req.flash('เลือกได้เฉพาะสมาชิกในระบบที่ยังใช้งานอยู่');
            return res.redirect('/leader/teams/new');
        }
        if (err.code === '23505') {
            req.flash('ชื่อทีมนี้ถูกใช้แล้ว');
            return res.redirect('/leader/teams/new');
        }
        console.error('create team error:', err);
        req.flash('สร้างทีมไม่สำเร็จ');
        return res.redirect('/leader/teams/new');
    }
};

exports.getMyTeams = async (req, res) => {
    try {
        const teams = await teamMemberModel.getTeamsByUserId(req.user.user_id);
        const teamId = req.query.team ? parseId(req.query.team) : null;
        if (!teamId) return res.render('leader/my-teams', { teams });

        const selectedTeam = await teamModel.getById(teamId);
        if (!selectedTeam || !(await isTeamLeader(teamId, req.user.user_id))) {
            req.flash('ไม่พบทีมหรือคุณไม่มีสิทธิ์จัดการ');
            return res.redirect('/leader/teams');
        }
        const [applications, members, categories] = await Promise.all([
            applicationModel.getByTeamId(teamId),
            teamMemberModel.getMembersByTeamId(teamId),
            categoryModel.getAll()
        ]);
        return res.render('leader/my-teams', {
            teams, selectedTeam, applications, members, categories, tab: req.query.tab
        });
    } catch (err) {
        console.error('getMyTeams error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.newTeamPage = async (req, res) => {
    try {
        const [categories, users] = await Promise.all([categoryModel.getAll(), userModel.getAll()]);
        return res.render('leader/create-team', { categories, users });
    } catch (err) {
        console.error('newTeamPage error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.updateMyTeam = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    const tab = ['info', 'appl', 'mem'].includes(req.query.tab) ? req.query.tab : 'info';
    if (!teamId || !(await isTeamLeader(teamId, req.user.user_id))) {
        req.flash('ไม่พบทีมหรือคุณไม่มีสิทธิ์จัดการ');
        return res.redirect('/leader/teams');
    }
    const { team_name, description, category_id, status } = req.body || {};
    if (!team_name?.trim() || !description?.trim() || team_name.trim().length > 100) {
        req.flash('กรุณาตรวจสอบชื่อทีมและรายละเอียด');
        return res.redirect(`/leader/teams?team=${teamId}&tab=${tab}`);
    }
    if (!['open', 'closed'].includes(status)) {
        req.flash('กรุณาเลือกสถานะการรับสมัครให้ถูกต้อง');
        return res.redirect(`/leader/teams?team=${teamId}&tab=${tab}`);
    }
    try {
        const categoryId = category_id ? parseId(category_id) : null;
        if (category_id && (!categoryId || !(await categoryModel.getById(categoryId)))) {
            req.flash('ไม่พบหมวดหมู่ที่ระบุ');
            return res.redirect(`/leader/teams?team=${teamId}&tab=${tab}`);
        }
        await teamModel.updateTeam(teamId, {
            team_name: team_name.trim(), description: description.trim(), category_id: categoryId, status
        });
        req.flash('บันทึกข้อมูลทีมแล้ว');
        return res.redirect(`/leader/teams?team=${teamId}&tab=${tab}`);
    } catch (err) {
        console.error('updateMyTeam error:', err);
        req.flash('บันทึกข้อมูลทีมไม่สำเร็จ');
        return res.redirect(`/leader/teams?team=${teamId}&tab=${tab}`);
    }
};

exports.removeMember = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    const memberId = parseId(req.params.memberId);
    if (!teamId || !memberId || !(await isTeamLeader(teamId, req.user.user_id))) {
        req.flash('ไม่พบทีมหรือคุณไม่มีสิทธิ์จัดการ');
        return res.redirect('/leader/teams');
    }
    try {
        const membership = await teamMemberModel.checkMember(teamId, memberId);
        if (!membership || membership.team_role === 'leader') {
            req.flash('ไม่สามารถนำสมาชิกคนนี้ออกได้');
        } else {
            await teamMemberModel.removeMember(teamId, memberId);
            req.flash('นำสมาชิกออกจากทีมแล้ว');
        }
        return res.redirect(`/leader/teams?team=${teamId}&tab=mem`);
    } catch (err) {
        console.error('removeMember error:', err);
        req.flash('นำสมาชิกออกจากทีมไม่สำเร็จ');
        return res.redirect(`/leader/teams?team=${teamId}&tab=mem`);
    }
};
