const db = require('../config/db');

/*ผู้ใช้ทั้งหมดที่ยังไม่ถูกลบ (กรองตามบทบาทได้)*/
exports.getUsers = async (role) => {
    const params = [];
    let sql = `SELECT user_id, username, first_name, last_name, email, github, phone,
                      profile_image, role, created_at
               FROM users
               WHERE deleted_at IS NULL`;

    if (role) {
        params.push(role);
        sql += ` AND role = $1`;
    }
    sql += ` ORDER BY CASE WHEN role = 'admin' THEN 0 ELSE 1 END, created_at DESC`;

    const result = await db.query(sql, params);
    return result.rows;
};

/*ตัวเลขสรุปสำหรับ dashboard*/
exports.getStats = async () => {
    const result = await db.query(
        `SELECT
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL)::int AS total_users,
            (SELECT COUNT(*) FROM users WHERE deleted_at IS NULL AND role = 'admin')::int AS total_admins,
            (SELECT COUNT(*) FROM teams)::int AS total_teams,
            (SELECT COUNT(*) FROM categories)::int AS total_categories,
            (SELECT COUNT(*) FROM applications WHERE status = 'pending')::int AS pending_applications`
    );
    return result.rows[0];
};
