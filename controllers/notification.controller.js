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

exports.open = async (req, res) => {
    const notificationId = parseId(req.params.notificationId);
    if (!notificationId) {
        req.flash('การแจ้งเตือนไม่ถูกต้อง');
        return res.redirect('/notifications');
    }

    try {
        const notification = await notificationModel.getByIdForUser(notificationId, req.user.user_id);
        if (!notification) {
            req.flash('ไม่พบการแจ้งเตือน');
            return res.redirect('/notifications');
        }

        await notificationModel.markRead(notificationId, req.user.user_id);
        const destination = typeof notification.link === 'string'
            && notification.link.startsWith('/')
            && !notification.link.startsWith('//')
            ? notification.link
            : '/notifications';
        return res.redirect(destination);
    } catch (err) {
        console.error('open notification error:', err);
        req.flash('เปิดการแจ้งเตือนไม่สำเร็จ');
        return res.redirect('/notifications');
    }
};

exports.stream = async (req, res) => {
    const userId = req.user.user_id;
    const cursor = Number(req.query.since);
    let lastId = Number.isSafeInteger(cursor) && cursor >= 0 ? cursor : 0;
    let polling = false;

    res.status(200);
    res.set({
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no'
    });
    res.flushHeaders?.();
    res.write('retry: 3000\n\n');

    const poll = async () => {
        if (polling || res.writableEnded || res.destroyed) return;
        polling = true;
        try {
            const eventCursor = Number(req.get('Last-Event-ID'));
            if (Number.isSafeInteger(eventCursor) && eventCursor > lastId) lastId = eventCursor;
            const notifications = await notificationModel.getAfterId(userId, lastId);
            for (const notification of notifications) {
                if (res.writableEnded || res.destroyed) break;
                lastId = Number(notification.notification_id);
                res.write(`id: ${lastId}\nevent: notification\ndata: ${JSON.stringify(notification)}\n\n`);
            }
        } catch (err) {
            console.error('notification stream error:', err);
        } finally {
            polling = false;
        }
    };

    const pollTimer = setInterval(poll, 3000);
    const heartbeatTimer = setInterval(() => {
        if (!res.writableEnded && !res.destroyed) res.write(': keep-alive\n\n');
    }, 20000);
    res.on('close', () => {
        clearInterval(pollTimer);
        clearInterval(heartbeatTimer);
    });
    await poll();
};
