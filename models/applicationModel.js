const db = require('../config/db');

/*เรีกยดูทั้งหมด*/
exports.getAll = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM applications ORDER BY applied_at DESC`;

        db.query(sql, [], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/*ตามไอดี เพื่อตรวจสอบรายละเอียดก่อนจะอนุมัติหรือปฏิเสธ*/
exports.getById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM applications WHERE application_id = $1`;

        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows[0]);
        });
    });
};

/*ดึงคำขอทั้งหมดที่ส่งเข้ามาในทีมที่ระบุเพื่อให้หัวหน้าทีมดู*/
exports.getByTeamId = (team_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT a.application_id, a.user_id, a.team_id, a.message, 
                        a.status, a.applied_at, a.reviewed_by, a.reviewed_at,
                        u.username, u.first_name, u.last_name, u.profile_image
                 FROM applications a
                 JOIN users u ON a.user_id = u.user_id
                 WHERE a.team_id = $1 AND u.deleted_at IS NULL
                 ORDER BY a.applied_at DESC`;

        db.query(sql, [team_id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/*ดึงคำขอทั้งหมดที่ผู้ใช้งานคนนี้เคยส่ง*/
exports.getByUserId = (user_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT a.application_id, a.user_id, a.team_id, a.message, 
                        a.status, a.applied_at, a.reviewed_at,
                        t.team_name, c.category_name
                 FROM applications a
                 JOIN teams t ON a.team_id = t.team_id
                 LEFT JOIN categories c ON t.category_id = c.category_id
                 JOIN users u ON a.user_id = u.user_id AND u.deleted_at IS NULL
                 WHERE a.user_id = $1
                 ORDER BY a.applied_at DESC`;

        db.query(sql, [user_id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/*ดึงคำขอล่าสุดของผู้ใช้ในทีมที่ระบุ เพื่อแสดงลิงก์รายละเอียดบนหน้าทีม*/
exports.getLatestByUserAndTeam = async (user_id, team_id) => {
    const result = await db.query(
        `SELECT * FROM applications
         WHERE user_id = $1 AND team_id = $2
         ORDER BY applied_at DESC
         LIMIT 1`,
        [user_id, team_id]
    );
    return result.rows[0] || null;
};

/*ตรวจสอบว่าผู้ใช้นี้มีคำขอที่รออนุมัติในทีมนี้อยู่แล้วมั้ย จะได้ไม่ส่งคำขอเข้าทีมเดิมซ้ำ ๆ*/
exports.checkPendingApplication = (user_id, team_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM applications 
                 WHERE user_id = $1 AND team_id = $2 AND status = 'pending'`;

        db.query(sql, [user_id, team_id], (err, result) => {
            if (err) return reject(err);
            // ถ้ามีคำขอค้างอยู่จะคืนค่า Object แถวนั้น ถ้าไม่มีจะคืนค่า undefined
            resolve(result.rows[0]);
        });
    });
};

/*สร้างคำขอ*/
exports.createApplication = async (application) => {
    const { user_id, team_id, message } = application;
    const client = await db.connect();

    try {
        await client.query('BEGIN');
        const teamResult = await client.query(
            'SELECT status, max_members, created_by, team_name FROM teams WHERE team_id = $1 FOR UPDATE',
            [team_id]
        );
        const team = teamResult.rows[0];
        if (!team) {
            const err = new Error('Team not found');
            err.code = 'TEAM_NOT_FOUND';
            throw err;
        }
        if (team.status !== 'open') {
            const err = new Error('Team is closed');
            err.code = 'TEAM_CLOSED';
            throw err;
        }

        const existingMember = await client.query(
            'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
            [team_id, user_id]
        );
        if (existingMember.rowCount) {
            const err = new Error('User is already a team member');
            err.code = 'ALREADY_MEMBER';
            throw err;
        }

        const memberCount = await client.query(
            'SELECT COUNT(*)::int AS count FROM team_members tm JOIN users u ON u.user_id = tm.user_id AND u.deleted_at IS NULL WHERE tm.team_id = $1',
            [team_id]
        );
        if (memberCount.rows[0].count >= team.max_members) {
            const err = new Error('Team is full');
            err.code = 'TEAM_FULL';
            throw err;
        }

        const created = await client.query(
            `INSERT INTO applications (user_id, team_id, message)
             VALUES ($1, $2, $3) RETURNING application_id`,
            [user_id, team_id, message]
        );

        if (Number(team.created_by) !== Number(user_id)) {
            await client.query(
                `INSERT INTO notifications (user_id, type, message, link_url)
                 VALUES ($1, 'application_received', $2, $3)`,
                [
                    team.created_by,
                    `มีคำขอเข้าร่วมทีม "${team.team_name}"`,
                    `/application/${created.rows[0].application_id}`
                ]
            );
        }

        await client.query('COMMIT');
        return { application_id: created.rows[0].application_id };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};

/*อัปเดตสถานะคำขอ*/
exports.updateStatus = (id, status, reviewed_by) => {
    return new Promise((resolve, reject) => {

        const sql = `UPDATE applications 
                 SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
                 WHERE application_id = $3`;

        db.query(sql, [status, reviewed_by, id], (err, result) => {
            if (err) return reject(err);

            resolve({ changes: result.rowCount });
        });
    });
};

/*ลบคำขอ*/
exports.deleteApplication = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM applications WHERE application_id = $1`;

        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/*พิจารณาคำขอ: อัปเดตสถานะ และถ้าอนุมัติจะเพิ่มสมาชิกเข้าทีมด้วย ใน transaction เดียวกัน
  คืนค่า { result: 'ok' | 'not_found' | 'already_reviewed' }*/
exports.reviewApplication = async (id, status, reviewed_by) => {
    if (!['approved', 'rejected'].includes(status)) {
        const err = new Error('Invalid application status');
        err.code = 'INVALID_APPLICATION_STATUS';
        throw err;
    }
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // หา team ก่อน แล้วล็อกตามลำดับ teams -> applications
        // ให้ลำดับ lock ตรงกับการลบทีมที่ cascade ไปยัง applications
        const lookup = await client.query(
            'SELECT team_id FROM applications WHERE application_id = $1',
            [id]
        );
        const teamId = lookup.rows[0]?.team_id;

        if (!teamId) {
            await client.query('ROLLBACK');
            return { result: 'not_found' };
        }

        const lockedTeam = await client.query(
            'SELECT status, max_members FROM teams WHERE team_id = $1 FOR UPDATE',
            [teamId]
        );
        const team = lockedTeam.rows[0];
        if (!team) {
            await client.query('ROLLBACK');
            return { result: 'not_found' };
        }

        // ล็อกใบสมัครหลังทีม เพื่อกันการพิจารณาซ้ำพร้อมกัน
        const found = await client.query(
            `SELECT a.application_id, a.user_id, a.team_id, a.status, t.team_name
             FROM applications a
             JOIN teams t ON t.team_id = a.team_id
             WHERE a.application_id = $1 FOR UPDATE OF a`,
            [id]
        );
        const application = found.rows[0];
        if (!application) {
            await client.query('ROLLBACK');
            return { result: 'not_found' };
        }
        if (application.status !== 'pending') {
            await client.query('ROLLBACK');
            return { result: 'already_reviewed' };
        }

        if (status === 'approved') {
            if (team.status !== 'open') {
                await client.query('ROLLBACK');
                return { result: 'team_closed' };
            }

            const existingMember = await client.query(
                'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
                [application.team_id, application.user_id]
            );
            if (existingMember.rowCount) {
                await client.query('ROLLBACK');
                return { result: 'already_member' };
            }

            const memberCount = await client.query(
                'SELECT COUNT(*)::int AS count FROM team_members tm JOIN users u ON u.user_id = tm.user_id AND u.deleted_at IS NULL WHERE tm.team_id = $1',
                [application.team_id]
            );
            if (memberCount.rows[0].count >= team.max_members) {
                await client.query('ROLLBACK');
                return { result: 'team_full' };
            }
        }

        await client.query(
            `UPDATE applications
             SET status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP
             WHERE application_id = $3`,
            [status, reviewed_by, id]
        );

        if (status === 'approved') {
            await client.query(
                `INSERT INTO team_members (team_id, user_id, team_role)
                 VALUES ($1, $2, 'member')
                 ON CONFLICT (team_id, user_id) DO NOTHING`,
                [application.team_id, application.user_id]
            );
        }

        const outcome = status === 'approved' ? 'ได้รับการอนุมัติ' : 'ถูกปฏิเสธ';
        await client.query(
            `INSERT INTO notifications (user_id, type, message, link_url)
             VALUES ($1, $2, $3, $4)`,
            [
                application.user_id,
                `application_${status}`,
                `คำขอเข้าร่วมทีม "${application.team_name}"${outcome}`,
                `/application/${id}`
            ]
        );

        await client.query('COMMIT');
        return { result: 'ok' };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};
