const db = require('../config/db');

exports.createUserReport = async ({ reporterId, reportedUserId, reason }) => {
    const result = await db.query(
        `INSERT INTO reports (reporter_id, target_type, reported_user_id, reason)
         VALUES ($1, 'user', $2, $3)
         RETURNING report_id`,
        [reporterId, reportedUserId, reason]
    );
    return result.rows[0];
};

exports.createTeamReport = async ({ reporterId, teamId, reason }) => {
    const result = await db.query(
        `INSERT INTO reports (reporter_id, target_type, team_id, reason)
         VALUES ($1, 'team', $2, $3)
         RETURNING report_id`,
        [reporterId, teamId, reason]
    );
    return result.rows[0];
};

exports.getAll = async () => {
    const result = await db.query(
        `SELECT r.report_id, r.target_type, r.reason, r.status, r.created_at,
                reporter.user_id AS reporter_id,
                reporter.username AS reporter_username,
                reporter.first_name AS reporter_first_name,
                reporter.last_name AS reporter_last_name,
                reporter.profile_image AS reporter_profile_image,
                reported_user.user_id AS reported_user_id,
                reported_user.username AS reported_user_username,
                reported_user.first_name AS reported_user_first_name,
                reported_user.last_name AS reported_user_last_name,
                reported_user.profile_image AS reported_user_profile_image,
                t.team_id, t.team_name
         FROM reports r
         JOIN users reporter ON reporter.user_id = r.reporter_id
         LEFT JOIN users reported_user ON reported_user.user_id = r.reported_user_id
         LEFT JOIN teams t ON t.team_id = r.team_id
         ORDER BY CASE WHEN r.status = 'pending' THEN 0 ELSE 1 END, r.created_at DESC`
    );
    return result.rows;
};

exports.getById = async (reportId) => {
    const result = await db.query(
        `SELECT r.*,
                reporter.username AS reporter_username,
                reporter.first_name AS reporter_first_name,
                reporter.last_name AS reporter_last_name,
                reporter.profile_image AS reporter_profile_image,
                reported_user.username AS reported_user_username,
                reported_user.first_name AS reported_user_first_name,
                reported_user.last_name AS reported_user_last_name,
                reported_user.profile_image AS reported_user_profile_image,
                t.team_name
         FROM reports r
         JOIN users reporter ON reporter.user_id = r.reporter_id
         LEFT JOIN users reported_user ON reported_user.user_id = r.reported_user_id
         LEFT JOIN teams t ON t.team_id = r.team_id
         WHERE r.report_id = $1`,
        [reportId]
    );
    return result.rows[0] || null;
};

exports.markHandled = async (reportId, adminId) => {
    const result = await db.query(
        `UPDATE reports
         SET status = 'handled', reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
         WHERE report_id = $1 AND status = 'pending'`,
        [reportId, adminId]
    );
    return result.rowCount;
};
