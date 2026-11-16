const db = require('../config/db');

exports.getByUserId = async (userId) => {
    const result = await db.query(
        `SELECT notification_id, type, message, is_read, created_at
         FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
};

exports.getUnreadCount = async (userId) => {
    const result = await db.query(
        'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = FALSE',
        [userId]
    );
    return result.rows[0].count;
};

exports.markRead = async (notificationId, userId) => {
    const result = await db.query(
        `UPDATE notifications SET is_read = TRUE
         WHERE notification_id = $1 AND user_id = $2 AND is_read = FALSE`,
        [notificationId, userId]
    );
    return result.rowCount;
};
