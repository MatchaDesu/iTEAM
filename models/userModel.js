const db = require('../config/db');

/*เรียกดูผู้ใช้ทั้งหมด*/
exports.getAll = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users`;
        db.query(sql, [], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/*สร้างบัญชีผู้ใช้*/
exports.createUser = (user) => {
    return new Promise((resolve, reject) => {
        const { username, first_name, last_name, email, phone, password } = user;
        const sql = `INSERT INTO users (username, password, first_name, last_name, email, phone)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`;

        db.query(sql, [username, password, first_name, last_name, email, phone], (err, result) => {
            if (err) return reject(err);
            resolve({ user_id: result.rows[0].user_id });
        });
    });
};

/*เรียกดูตามไอดี*/
exports.getById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users WHERE user_id = $1`;
        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows[0]);
        });
    });
};

/*เรียกดูตามอีเมล*/
exports.getByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users WHERE email = $1`;
        db.query(sql, [email], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows[0]);
        });
    });
};

/*เรียกดูตามบท*/
exports.getByRole = (role) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM users WHERE role = $1`;
        db.query(sql, [role], (err, result) => {
            if (err) return reject(err);
            resolve(result.rows);
        });
    });
};

/*อัตเดตรูปโปรไฟล์*/
exports.updateProfile = (id, path) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET profile_image = $1 WHERE user_id = $2`;
        db.query(sql, [path, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/*อัตเดตข้อมูลผู้ใช้*/
exports.updateUserInfo = (id, data) => {
    return new Promise((resolve, reject) => {
        const { username, first_name, last_name, email, phone } = data;
        const sql = `UPDATE users 
                 SET username = $1, first_name = $2, last_name = $3, email = $4, phone = $5
                 WHERE user_id = $6`;

        db.query(sql, [username, first_name, last_name, email, phone, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/*อัพเดตรหัสผ่าน*/
exports.updateUserPassword = (id, password) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET password = $1 WHERE user_id = $2`;
        db.query(sql, [password, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/*อัพเดตบทบาท*/
exports.updateUserRole = (id, role) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET role = $1 WHERE user_id = $2`;
        db.query(sql, [role, id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};

/*ลมบัญชี*/
exports.softDelete = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE user_id = $1`;
        db.query(sql, [id], (err, result) => {
            if (err) return reject(err);
            resolve({ changes: result.rowCount });
        });
    });
};