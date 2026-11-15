const userModel = require('../models/userModel');
const teamMemberModel = require('../models/teamMemberModel');
const { parseId } = require('../utils/currentUser');

// GET /users/:userId
exports.getProfile = async (req, res) => {
    const userId = parseId(req.params.userId);
    if (!userId) {
        return res.status(400).json({ message: 'userId ไม่ถูกต้อง' });
    }

    try {
        const user = await userModel.getById(userId);
        if (!user) {
            return res.status(404).json({ message: 'ไม่พบผู้ใช้' });
        }

        const teams = await teamMemberModel.getTeamsByUserId(userId);
        return res.json({ user, teams });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};