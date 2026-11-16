const notificationModel = require('../models/notificationModel');
const { parseId } = require('../utils/currentUser');

exports.index = async (req, res) => {
    try {
        const notifications = await notificationModel.getByUserId(req.user.user_id);
        return res.render('teams/notifications', { notifications, active: 'notes' });
    } catch (err) {
        console.error('get notifications error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.markRead = async (req, res) => {
    const notificationId = parseId(req.params.notificationId);
    if (!notificationId) {
        req.flash('การแจ้งเตือนไม่ถูกต้อง');
        return res.redirect('/notifications');
    }
    try {
        const changes = await notificationModel.markRead(notificationId, req.user.user_id);
        if (changes) req.flash('ทำเครื่องหมายว่าอ่านแล้ว');
        return res.redirect('/notifications');
    } catch (err) {
        console.error('mark notification read error:', err);
        req.flash('อัปเดตการแจ้งเตือนไม่สำเร็จ');
        return res.redirect('/notifications');
    }
};
