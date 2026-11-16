const db = require('../config/db');

exports.getByUserId = async (userId) => {
    const result = await db.query(
        `SELECT t.*, c.category_name,
                (SELECT COUNT(*)::int FROM team_members tm
                 JOIN users u ON u.user_id = tm.user_id AND u.deleted_at IS NULL
                 WHERE tm.team_id = t.team_id) AS member_count
         FROM favorite_teams f
         JOIN teams t ON t.team_id = f.team_id
         LEFT JOIN categories c ON c.category_id = t.category_id
         WHERE f.user_id = $1
         ORDER BY f.created_at DESC`,
        [userId]
    );
    return result.rows;
};

exports.getTeamIdsByUserId = async (userId) => {
    const result = await db.query(
        'SELECT team_id FROM favorite_teams WHERE user_id = $1', [userId]
    );
    return result.rows.map(row => row.team_id);
};

exports.isFavorite = async (userId, teamId) => {
    const result = await db.query(
        'SELECT 1 FROM favorite_teams WHERE user_id = $1 AND team_id = $2',
        [userId, teamId]
    );
    return result.rowCount > 0;
};

exports.add = async (userId, teamId) => {
    await db.query(
        `INSERT INTO favorite_teams (user_id, team_id) VALUES ($1, $2)
         ON CONFLICT (user_id, team_id) DO NOTHING`,
        [userId, teamId]
    );
};

exports.remove = async (userId, teamId) => {
    await db.query(
        'DELETE FROM favorite_teams WHERE user_id = $1 AND team_id = $2',
        [userId, teamId]
    );
};
