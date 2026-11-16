const favoriteModel = require('../models/favoriteModel');
const teamModel = require('../models/teamModel');
const { parseId } = require('../utils/currentUser');

exports.index = async (req, res) => {
    try {
        const teams = await favoriteModel.getByUserId(req.user.user_id);
        return res.render('teams/favorites', {
            teams,
            favoriteTeamIds: teams.map(team => team.team_id),
            favoriteReturnTo: '/favorites',
            active: 'favorites'
        });
    } catch (err) {
        console.error('get favorites error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

const finish = (req, res, message) => {
    req.flash(message);
    const returnTo = req.body?.returnTo;
    const safeReturnTo = returnTo === '/favorites' || returnTo === '/teams'
        || (typeof returnTo === 'string' && /^\/teams\/\d+$/.test(returnTo));
    return res.redirect(safeReturnTo ? returnTo : '/teams');
};

exports.save = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) return finish(req, res, 'ทีมไม่ถูกต้อง');
    try {
        if (!(await teamModel.getById(teamId))) return finish(req, res, 'ไม่พบทีม');
        await favoriteModel.add(req.user.user_id, teamId);
        return finish(req, res, 'บันทึกทีมโปรดแล้ว');
    } catch (err) {
        console.error('save favorite error:', err);
        return finish(req, res, 'บันทึกทีมโปรดไม่สำเร็จ');
    }
};

exports.remove = async (req, res) => {
    const teamId = parseId(req.params.teamId);
    if (!teamId) return finish(req, res, 'ทีมไม่ถูกต้อง');
    try {
        await favoriteModel.remove(req.user.user_id, teamId);
        return finish(req, res, 'นำทีมออกจากรายการโปรดแล้ว');
    } catch (err) {
        console.error('remove favorite error:', err);
        return finish(req, res, 'นำทีมออกจากรายการโปรดไม่สำเร็จ');
    }
};
