const db = require('../config/db');


exports.getMembersByTeamId = (team_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT tm.team_id, tm.user_id, tm.team_role, tm.joined_at,
                        u.username, u.first_name, u.last_name, u.profile_image
                 FROM team_members tm
                 JOIN users u ON tm.user_id = u.user_id
                 WHERE tm.team_id = $1 AND u.deleted_at IS NULL`;

    db.query(sql, [team_id], (err, result) => {
      if (err) return reject(err);

      resolve(result.rows);
    });
  });
};


exports.getTeamsByUserId = (user_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT tm.team_id, tm.user_id, tm.team_role, tm.joined_at,
                        t.team_name, t.description, t.category_id
                 FROM team_members tm
                 JOIN teams t ON tm.team_id = t.team_id
                 JOIN users u ON tm.user_id = u.user_id AND u.deleted_at IS NULL
                 WHERE tm.user_id = $1`;

    db.query(sql, [user_id], (err, result) => {
      if (err) return reject(err);
      resolve(result.rows);
    });
  });
};


exports.checkMember = (team_id, user_id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM team_members WHERE team_id = $1 AND user_id = $2`;

    db.query(sql, [team_id, user_id], (err, result) => {
      if (err) return reject(err);
      resolve(result.rows[0]);
    });
  });
};


exports.addMember = (team_id, user_id, team_role = 'member') => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO team_members (team_id, user_id, team_role) 
                 VALUES ($1, $2, $3)`;

    db.query(sql, [team_id, user_id, team_role], (err, result) => {
      if (err) return reject(err);
      resolve({ changes: result.rowCount });
    });
  });
};


exports.updateRole = (team_id, user_id, team_role) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE team_members 
                 SET team_role = $1 
                 WHERE team_id = $2 AND user_id = $3`;

    db.query(sql, [team_role, team_id, user_id], (err, result) => {
      if (err) return reject(err);
      resolve({ changes: result.rowCount });
    });
  });
};


exports.removeMember = (team_id, user_id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM team_members 
                 WHERE team_id = $1 AND user_id = $2`;

    db.query(sql, [team_id, user_id], (err, result) => {
      if (err) return reject(err);
      resolve({ changes: result.rowCount });
    });
  });
};
