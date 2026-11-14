const db = require('../config/db');

/*เรีกยดูทั้งหมด*/
exports.getAll = () => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM teams`;

        db.query(sql, [], (err, result) => {
            if (err) return reject(err);

            resolve(result.rows);
        });
    });
};


exports.getById = (id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM teams WHERE team_id = $1`;

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