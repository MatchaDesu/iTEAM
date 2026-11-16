
const db = require('../config/db');
const password = require('../utils/password');

/* เรียกดูผู้ใช้ทั้งหมด */
exports.getAll = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT user_id, username, first_name, last_name, email, github, phone, profile_image, role, skills, bio, created_at
                     FROM users WHERE deleted_at IS NULL`;
        db.query(sql, [], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/* สร้างบัญชีผู้ใช้ */
exports.createUser = async (user) => {
    const { username, first_name, last_name, email, github, phone, password: plainPassword } = user;
    const hashedPassword = await password.hashPassword(plainPassword);

    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO users (username, password, first_name, last_name, email, github, phone)
                     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id`;

        db.query(sql, [username, hashedPassword, first_name, last_name, email, github, phone], (err, result) => {
            if (err) return reject(err);
            resolve({ user_id: result.rows[0].user_id });
        });
    });
};

/* เรียกดูตามไอดี */
exports.getById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT user_id, username, first_name, last_name, email, github, phone, profile_image, role, skills, bio, created_at
                     FROM users WHERE user_id = $1 AND deleted_at IS NULL`;
        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows[0]);
        });
    });
};

/* เรียกดูตามอีเมล */
exports.getByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users WHERE email = $1`;
        db.query(sql, [email], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows[0]);
        });
    });
};

/* เรียกดูตามบทบาท */
exports.getByRole = (role) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT user_id, username, first_name, last_name, email, github, phone, profile_image, role, created_at
                     FROM users WHERE role = $1 AND deleted_at IS NULL`;
        db.query(sql, [role], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/* อัปเดตรูปโปรไฟล์ */
exports.updateProfile = (id, path) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET profile_image = $1 WHERE user_id = $2 AND deleted_at IS NULL`;
        db.query(sql, [path, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/* อัปเดตข้อมูลผู้ใช้ */
exports.updateUserInfo = (id, data) => {
    return new Promise((resolve, reject) => {
        const { username, first_name, last_name, email, github, phone, skills, bio } = data;
        const sql = `UPDATE users
                     SET username = $1, first_name = $2, last_name = $3, email = $4, github = NULLIF(BTRIM($5), ''), phone = $6,
                         skills = $7, bio = $8
                     WHERE user_id = $9 AND deleted_at IS NULL`;

        db.query(sql, [username, first_name, last_name, email, github, phone, skills, bio, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/* อัปเดตรหัสผ่าน */
exports.updateUserPassword = async (id, newPassword) => {
    const hashedPassword = await password.hashPassword(newPassword);

    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET password = $1 WHERE user_id = $2 AND deleted_at IS NULL`;
        db.query(sql, [hashedPassword, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/* อัปเดตบทบาท */
exports.updateUserRole = (id, role) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET role = $1 WHERE user_id = $2 AND deleted_at IS NULL`;
        db.query(sql, [role, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/* ลบบัญชี (Soft Delete) */
exports.softDelete = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND deleted_at IS NULL`;
        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};
