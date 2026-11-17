const userModel = require('../models/userModel');
const notificationModel = require('../models/notificationModel');

// โหลดผู้ใช้ที่ล็อกอินอยู่จากฐานข้อมูลทุก request
//  - res.locals.user : ข้อมูลเต็ม ใช้ใน views (header.ejs ฯลฯ) เป็น null ถ้ายังไม่ล็อกอิน
//  - req.user        : { user_id, role } ใช้ใน controller (role เป็นค่าล่าสุดจาก DB เสมอ)
exports.attachUser = async (req, res, next) => {
    res.locals.user = null;

    const sessionUser = req.session?.user;
    if (!sessionUser) return next();

    try {
        const [user, notificationSummary] = await Promise.all([
            userModel.getById(sessionUser.user_id),
            notificationModel.getSummary(sessionUser.user_id).catch((notificationErr) => {
                // Keep the page available even if the badge count query fails.
                console.error('load unread notifications error:', notificationErr);
                return { unreadCount: 0, latestId: 0 };
            })
        ]);

        if (!user) {
            // บัญชีถูกลบไปแล้ว ล้างข้อมูลล็อกอินออกจาก session
            delete req.session.user;
            return next();
        }

        req.user = { user_id: user.user_id, role: user.role };
        res.locals.user = user;
        res.locals.unread = notificationSummary.unreadCount;
        res.locals.notificationCursor = notificationSummary.latestId;
        return next();
    } catch (err) {
        return next(err);
    }
};
