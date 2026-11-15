const applicationModel = require('../models/applicationModel');
const { getCurrentUserId, parseId } = require('../utils/currentUser');
const { isTeamLeader } = require('../utils/teamAccess');

// GET /application  (คำขอทั้งหมดของผู้ใช้คนนี้)
exports.getMine = async (req, res) => {
    const userId = getCurrentUserId(req);
    if (!userId) {
        return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    try {
        const applications = await applicationModel.getByUserId(userId);
        return res.json({ applications });
    } catch (err) {
        console.error('getMine error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// GET /application/:appId  (เจ้าของคำขอเท่านั้น)
exports.getById = async (req, res) => {
    const appId = parseId(req.params.appId);
    const userId = getCurrentUserId(req);

    if (!appId) {
        return res.status(400).json({ message: 'appId ไม่ถูกต้อง' });
    }
    if (!userId) {
        return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้' });
    }

    try {
        const application = await applicationModel.getById(appId);
        if (!application) {
            return res.status(404).json({ message: 'ไม่พบคำขอ' });
        }
        if (application.user_id !== userId) {
            return res.status(403).json({ message: 'ไม่มีสิทธิ์ดูคำขอนี้' });
        }
        return res.json({ application });
    } catch (err) {
        console.error('getById application error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// PATCH /application/:appId  body: { status: 'approved' | 'rejected' }  (leader ของทีมนั้นเท่านั้น)
exports.review = async (req, res) => {
    const appId = parseId(req.params.appId);
    const userId = getCurrentUserId(req);
    const status = req.body?.status;

    if (!appId) {
        return res.status(400).json({ message: 'appId ไม่ถูกต้อง' });
    }
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "status ต้องเป็น 'approved' หรือ 'rejected'" });
    }

    try {
        const application = await applicationModel.getById(appId);
        if (!application) {
            return res.status(404).json({ message: 'ไม่พบคำขอ' });
        }
        if (!(await isTeamLeader(application.team_id, userId))) {
            return res.status(403).json({ message: 'เฉพาะหัวหน้าทีมเท่านั้น' });
        }

        const { result } = await applicationModel.reviewApplication(appId, status, userId);

        if (result === 'not_found') {
            return res.status(404).json({ message: 'ไม่พบคำขอ' });
        }
        if (result === 'already_reviewed') {
            return res.status(409).json({ message: 'คำขอนี้ถูกพิจารณาไปแล้ว' });
        }

        return res.json({
            message: status === 'approved' ? 'อนุมัติคำขอแล้ว' : 'ปฏิเสธคำขอแล้ว'
        });
    } catch (err) {
        console.error('review error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};