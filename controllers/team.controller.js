const teamModel = require('../models/teamModel');
const teamMemberModel = require('../models/teamMemberModel');
const applicationModel = require('../models/applicationModel');
const categoryModel = require('../models/categoryModel');
const { isTeamLeader } = require('../utils/teamAccess');
const { getCurrentUserId, parseId } = require('../utils/currentUser');

// GET /teams
exports.getAll = async (req, res) => {
    try {
        const teams = await teamModel.getAll();
        return res.json({ teams });
    } catch (err) {
        console.error('getAll teams error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// GET /teams/:teamId
exports.getById = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) {
        return res.status(400).json({ message: 'teamId ไม่ถูกต้อง' });
    }

    try {
        const team = await teamModel.getById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'ไม่พบทีม' });
        }

        const members = await teamMemberModel.getMembersByTeamId(teamId);
        return res.json({ team, members });
    } catch (err) {
        console.error('getById team error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// POST /teams/:teamId/apply
exports.apply = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    const userId = getCurrentUserId(req);
    const message = req.body?.message?.trim() || null;

    if (!teamId) {
        return res.status(400).json({ message: 'teamId ไม่ถูกต้อง' });
    }
    if (!userId) {
        return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้ที่ส่งคำขอ' });
    }

    try {
        const team = await teamModel.getById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'ไม่พบทีม' });
        }

        if (await teamMemberModel.checkMember(teamId, userId)) {
            return res.status(409).json({ message: 'คุณเป็นสมาชิกของทีมนี้อยู่แล้ว' });
        }

        if (await applicationModel.checkPendingApplication(userId, teamId)) {
            return res.status(409).json({ message: 'คุณมีคำขอที่รออนุมัติในทีมนี้อยู่แล้ว' });
        }

        const { application_id } = await applicationModel.createApplication({
            user_id: userId,
            team_id: teamId,
            message
        });

        return res.status(201).json({ message: 'ส่งคำขอเข้าทีมสำเร็จ', application_id });
    } catch (err) {
        // unique_pending_application: กรณีส่งคำขอซ้ำพร้อมกัน
        if (err.code === '23505') {
            return res.status(409).json({ message: 'คุณมีคำขอที่รออนุมัติในทีมนี้อยู่แล้ว' });
        }
        // foreign_key_violation: user_id ไม่มีอยู่จริง
        if (err.code === '23503') {
            return res.status(400).json({ message: 'ไม่พบผู้ใช้' });
        }
        console.error('apply error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// POST /teams  (ต้องล็อกอิน คนสร้างจะเป็น leader ของทีม)
exports.create = async (req, res) => {
    const userId = getCurrentUserId(req);
    const { team_name, description, category_id } = req.body || {};

    if (!team_name || !team_name.trim() || !description || !description.trim()) {
        return res.status(400).json({ message: 'กรุณากรอก team_name และ description' });
    }
    if (team_name.trim().length > 100) {
        return res.status(400).json({ message: 'team_name ต้องไม่เกิน 100 ตัวอักษร' });
    }

    try {
        let categoryId = null;
        if (category_id !== undefined && category_id !== null && category_id !== '') {
            categoryId = parseId(category_id);
            if (!categoryId || !(await categoryModel.getById(categoryId))) {
                return res.status(400).json({ message: 'ไม่พบหมวดหมู่ที่ระบุ' });
            }
        }

        const { team_id } = await teamModel.createTeamWithLeader({
            team_name: team_name.trim(),
            description: description.trim(),
            category_id: categoryId,
            created_by: userId
        });

        return res.status(201).json({ message: 'สร้างทีมสำเร็จ', team_id });
    } catch (err) {
        if (err.code === '23505') {
            return res.status(409).json({ message: 'ชื่อทีมนี้ถูกใช้แล้ว' });
        }
        console.error('create team error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// GET /teams/:teamId/applications  (leader ของทีมเท่านั้น)
exports.getApplications = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    const userId = getCurrentUserId(req);

    if (!teamId) {
        return res.status(400).json({ message: 'teamId ไม่ถูกต้อง' });
    }

    try {
        const team = await teamModel.getById(teamId);
        if (!team) {
            return res.status(404).json({ message: 'ไม่พบทีม' });
        }
        if (!(await isTeamLeader(teamId, userId))) {
            return res.status(403).json({ message: 'เฉพาะหัวหน้าทีมเท่านั้น' });
        }

        const applications = await applicationModel.getByTeamId(teamId);
        return res.json({ applications });
    } catch (err) {
        console.error('getApplications error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};