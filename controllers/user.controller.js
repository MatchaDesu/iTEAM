const userModel = require('../models/userModel');
const teamMemberModel = require('../models/teamMemberModel');
const applicationModel = require('../models/applicationModel');
const { parseId } = require('../utils/currentUser');

// GET /users/:userId
exports.getProfile = async (req, res) => {
    const userId = parseId(req.params.userId);
    if (!userId) {
        return res.status(400).send('ไม่พบผู้ใช้');
    }

    try {
        const user = await userModel.getById(userId);
        if (!user) {
            return res.status(404).send('ไม่พบผู้ใช้');
        }

        const teams = await teamMemberModel.getTeamsByUserId(userId);
        return res.render('users/detail_profile', { profileUser: user, teams });
    } catch (err) {
        console.error('getProfile error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.getMyProfile = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const [profileUser, teams, applications] = await Promise.all([
            userModel.getById(userId),
            teamMemberModel.getTeamsByUserId(userId),
            applicationModel.getByUserId(userId)
        ]);
        return res.render('users/profile', { profileUser, teams, applications });
    } catch (err) {
        console.error('getMyProfile error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.editMyProfile = async (req, res) => {
    try {
        const user = await userModel.getById(req.user.user_id);
        return res.render('users/edit', { user });
    } catch (err) {
        console.error('editMyProfile error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.updateMyProfile = async (req, res) => {
    const { username, first_name, last_name, email, github, phone, skills, bio } = req.body;
    if (![username, first_name, last_name, email, phone].every(value => typeof value === 'string' && value.trim())) {
        req.flash('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
        return res.redirect('/profile/edit');
    }
    try {
        await userModel.updateUserInfo(req.user.user_id, {
            username: username.trim(), first_name: first_name.trim(), last_name: last_name.trim(),
            email: email.trim(), github: (github || '').trim(), phone: phone.trim(),
            skills: (skills || '').split(',').map(skill => skill.trim()).filter(Boolean),
            bio: (bio || '').trim()
        });
        req.flash('บันทึกโปรไฟล์แล้ว');
        return res.redirect('/profile');
    } catch (err) {
        console.error('updateMyProfile error:', err);
        req.flash('บันทึกโปรไฟล์ไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล');
        return res.redirect('/profile/edit');
    }
};
