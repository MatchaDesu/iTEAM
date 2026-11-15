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
                 WHERE a.team_id = $1
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
                        t.team_name
                 FROM applications a
                 JOIN teams t ON a.team_id = t.team_id
                 WHERE a.user_id = $1
                 ORDER BY a.applied_at DESC`;

        db.query(sql, [user_id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
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
exports.createApplication = (application) => {
    return new Promise((resolve, reject) => {
        const { user_id, team_id, message } = application;

        // ใช้ RETURNING application_id เพื่อให้ PostgreSQL ส่งรหัสคำขอที่เพิ่งสร้างกลับมา
        const sql = `INSERT INTO applications (user_id, team_id, message) 
                 VALUES ($1, $2, $3) RETURNING application_id`;

        db.query(sql, [user_id, team_id, message], (err, result) => {
            if (err) return reject(err);
            resolve({ application_id: result.rows[0].application_id });
        });
    });
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
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // ล็อกแถวไว้ กันสองคนกดอนุมัติ/ปฏิเสธพร้อมกัน
        const found = await client.query(
            `SELECT application_id, user_id, team_id, status
             FROM applications WHERE application_id = $1 FOR UPDATE`,
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

        await client.query('COMMIT');
        return { result: 'ok' };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
};