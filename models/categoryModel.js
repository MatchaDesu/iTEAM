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

exports.createCategory = (category_name) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO categories (category_name) VALUES ($1) RETURNING category_id`;

    db.query(sql, [category_name], (err, result) => {
      if (err) return reject(err);
      resolve({ category_id: result.rows[0].category_id });
    });
  });
};

exports.updateCategory = (id, category_name) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE categories SET category_name = $1 WHERE category_id = $2`;

    db.query(sql, [category_name, id], (err, result) => {
      if (err) return reject(err);
      resolve({ changes: result.rowCount });
    });
  });
};

exports.deleteCategory = (id) => {
  return new Promise((resolve, reject) => {
    const sql = `DELETE FROM categories WHERE category_id = $1`;

    db.query(sql, [id], (err, result) => {
      if (err) return reject(err);
      resolve({ changes: result.rowCount });
    });
  });
};