const db = require('../config/db');

/*เรีกยดูทั้งหมด*/
exports.getAll = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT t.*, c.category_name
                 FROM teams t
                 LEFT JOIN categories c ON t.category_id = c.category_id
                 ORDER BY t.created_at DESC`;

        db.query(sql, [], (err, result) => {
            if (err) return reject(err);

            resolve(result.rows);
        });
    });
};


exports.getById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT t.*, c.category_name,
                        (SELECT COUNT(*)::int FROM team_members tm
                         JOIN users u ON u.user_id = tm.user_id AND u.deleted_at IS NULL
                         WHERE tm.team_id = t.team_id) AS member_count
                 FROM teams t
                 LEFT JOIN categories c ON t.category_id = c.category_id
                 WHERE t.team_id = $1`;

        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);

            resolve(result.rows[0]);
        });
    });
};


exports.createTeam = (team) => {
    return new Promise((resolve, reject) => {
        const { team_name, description, category_id, created_by } = team;

        const sql = `INSERT INTO teams (team_name, description, category_id, created_by)
                 VALUES ($1, $2, $3, $4) RETURNING team_id`;

        db.query(sql, [team_name, description, category_id, created_by], (err, result) => {
            if (err) return reject(err);

            resolve({ team_id: result.rows[0].team_id });
        });
    });
};


exports.updateTeam = (id, data) => {
    return new Promise((resolve, reject) => {
        const { team_name, description, category_id } = data;

        const sql = `UPDATE teams 
                 SET team_name = $1, description = $2, category_id = $3, updated_at = CURRENT_TIMESTAMP
                 WHERE team_id = $4`;

        db.query(sql, [team_name, description, category_id, id], (err, result) => {
            if (err) return reject(err);

            resolve({ changes: result.rowCount });
        });
    });
};


exports.deleteTeam = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM teams WHERE team_id = $1`;

        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);

            resolve({ changes: result.rowCount });
        });
    });
};

/*สร้างทีม และเพิ่มคนสร้างเป็น leader ใน transaction เดียวกัน (สำเร็จทั้งคู่หรือไม่ก็ยกเลิกทั้งคู่)*/
exports.createTeamWithLeader = async (team) => {
    const {
        team_name, description, category_id, max_members = 5,
        roles = [], initial_members = [], created_by
    } = team;
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const created = await client.query(
            `INSERT INTO teams (team_name, description, category_id, max_members, roles, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING team_id`,
            [team_name, description, category_id, max_members, roles, created_by]
        );
        const team_id = created.rows[0].team_id;

        await client.query(
            `INSERT INTO team_members (team_id, user_id, team_role)
             VALUES ($1, $2, 'leader')`,
            [team_id, created_by]
        );

        if (initial_members.length) {
            const addedMembers = await client.query(
                `INSERT INTO team_members (team_id, user_id, team_role)
                 SELECT $1, user_id, 'member' FROM users
                 WHERE user_id = ANY($2::int[]) AND role = 'member' AND deleted_at IS NULL
                 RETURNING user_id`,
                [team_id, initial_members]
            );
            if (addedMembers.rowCount !== initial_members.length) {
                const err = new Error('Invalid initial team members');
                err.code = 'INVALID_INITIAL_MEMBERS';
                throw err;
            }
        }

        await client.query('COMMIT');
        return { team_id };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
