const db = require('../config/db');

/*เรีกยดูทั้งหมด*/
exports.getAll = () => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM categories`;

    db.query(sql, [], (err, result) => {
      if (err) return reject(err);
      resolve(result.rows);
    });
  });
};

exports.getById = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `SELECT * FROM categories WHERE category_id = $1`;

    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      resolve(result.rows[0]);
    });
  });
};

