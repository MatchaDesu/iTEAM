const adminModel = require('../models/adminModel');
const { getCurrentUserId, parseId } = require('../utils/currentUser');

const ROLES = ['member', 'admin'];

// GET /admin
exports.dashboard = async (req, res) => {
    try {
        const stats = await adminModel.getStats();
        return res.json({ stats });
    } catch (err) {
        console.error('dashboard error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// GET /admin/users?role=member|admin
exports.getUsers = async (req, res) => {
    const { role } = req.query;
    if (role !== undefined && !ROLES.includes(role)) {
        return res.status(400).json({ message: "role ต้องเป็น 'member' หรือ 'admin'" });
    }

    try {
        const users = await adminModel.getUsers(role);
        return res.json({ users });
    } catch (err) {
        console.error('admin getUsers error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// PATCH /admin/users/:userId/role  body: { role: 'member' | 'admin' }
exports.updateRole = async (req, res) => {
    const targetId = parseId(req.params.userId);
    const role = req.body?.role;

    if (!targetId) {
        return res.status(400).json({ message: 'userId ไม่ถูกต้อง' });
    }
    if (!ROLES.includes(role)) {
        return res.status(400).json({ message: "role ต้องเป็น 'member' หรือ 'admin'" });
    }
    // กัน admin ลดสิทธิ์ตัวเองจนระบบไม่เหลือ admin
    if (targetId === getCurrentUserId(req)) {
        return res.status(400).json({ message: 'ไม่สามารถเปลี่ยนบทบาทของตัวเองได้' });
    }

    try {
        const { changes } = await adminModel.setUserRole(targetId, role);
        if (!changes) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }
        return res.json({ message: 'เปลี่ยนบทบาทสำเร็จ' });
    } catch (err) {
        console.error('updateRole error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};