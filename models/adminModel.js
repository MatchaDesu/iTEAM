const db = require('../config/db');

/*ผู้ใช้ทั้งหมด รวมบัญชีที่ถูกแบน (กรองตามบทบาทได้)*/
exports.getUsers = async (role) => {
    const params = [];
    let sql = `SELECT user_id, username, first_name, last_name, email, github, phone,
                      profile_image, role, created_at, deleted_at
               FROM users WHERE TRUE`;

    if (role) {
        params.push(role);
        sql += ` AND role = $1`;
    }
    sql += ` ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at DESC`;

    const result = await db.query(sql, params);
    return result.rows;
};

exports.getUsersPage = async ({ role, q, limit, offset }) => {
    const params = [];
    const conditions = [];
    if (role) {
        params.push(role);
        conditions.push(`role = $${params.length}`);
    }
    if (q) {
        params.push(`%${q}%`);
        const p = `$${params.length}`;
        conditions.push(`(username ILIKE ${p} OR first_name ILIKE ${p} OR last_name ILIKE ${p} OR email ILIKE ${p})`);
    }
    const where = conditions.length ? conditions.join(' AND ') : 'TRUE';
    const count = await db.query(`SELECT COUNT(*)::int AS total FROM users WHERE ${where}`, params);
    const dataParams = [...params, limit, offset];
    const result = await db.query(
        `SELECT user_id, username, first_name, last_name, email, github, phone,
                profile_image, role, created_at, deleted_at
         FROM users WHERE ${where}
         ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at DESC
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams
    );
    return { users: result.rows, total: count.rows[0].total };
};

/*ตัวเลขสรุปสำหรับ dashboard*/
exports.getStats = async () => {
    const result = await db.query(
        `SELECT
            (SELECT COUNT(*) FROM users)::int AS total_users,
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'admin')::int AS total_admins,
            (SELECT COUNT(*) FROM teams WHERE deleted_at IS NULL)::int AS total_teams,
            (SELECT COUNT(*) FROM reports)::int AS total_reports,
            (SELECT COUNT(*) FROM reports WHERE status = 'pending')::int AS pending_reports`
    );
    return result.rows[0];
};

exports.getUserById = async (userId) => {
    const result = await db.query(
        `SELECT user_id, username, first_name, last_name, email, github, phone,
                profile_image, role, skills, bio, created_at, deleted_at
         FROM users WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0];
};

exports.setMemberBanned = async (userId, banned) => {
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const userUpdate = await client.query(
            banned
                ? `UPDATE users SET deleted_at = CURRENT_TIMESTAMP
                   WHERE user_id = $1 AND role = 'member' AND deleted_at IS NULL`
                : `UPDATE users SET deleted_at = NULL
                   WHERE user_id = $1 AND role = 'member' AND deleted_at IS NOT NULL`,
            [userId]
        );
        if (userUpdate.rowCount !== 1) {
            await client.query('ROLLBACK');
            return false;
        }
        await client.query(
            banned
                ? `UPDATE teams SET deleted_at = CURRENT_TIMESTAMP
                   WHERE created_by = $1 AND deleted_at IS NULL`
                : `UPDATE teams SET deleted_at = NULL
                   WHERE created_by = $1 AND deleted_at IS NOT NULL`,
            [userId]
        );
        await client.query('COMMIT');
        return true;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
