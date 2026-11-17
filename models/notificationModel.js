const db = require('../config/db');

exports.getByUserId = async (userId) => {
    const result = await db.query(
        `SELECT notification_id, type, message, link_url, is_read, created_at
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

exports.getSummary = async (userId) => {
    const result = await db.query(
        `SELECT COUNT(*) FILTER (WHERE is_read = FALSE)::int AS unread_count,
                COALESCE(MAX(notification_id), 0)::int AS latest_id
         FROM notifications WHERE user_id = $1`,
        [userId]
    );
    return {
        unreadCount: result.rows[0].unread_count,
        latestId: result.rows[0].latest_id
    };
};

exports.getAfterId = async (userId, notificationId) => {
    const result = await db.query(
        `SELECT notification_id, type, message, link_url, is_read, created_at
         FROM notifications
         WHERE user_id = $1 AND notification_id > $2
         ORDER BY notification_id ASC`,
        [userId, notificationId]
    );
    return result.rows;
};

exports.getByIdForUser = async (notificationId, userId) => {
    const result = await db.query(
        `SELECT notification_id, link_url
         FROM notifications WHERE notification_id = $1 AND user_id = $2`,
        [notificationId, userId]
    );
    return result.rows[0] || null;
};

exports.markRead = async (notificationId, userId) => {
    const result = await db.query(
        `UPDATE notifications SET is_read = TRUE
         WHERE notification_id = $1 AND user_id = $2 AND is_read = FALSE`,
        [notificationId, userId]
    );
    return result.rowCount;
};
