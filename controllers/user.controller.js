const userModel = require('../models/userModel');
const teamMemberModel = require('../models/teamMemberModel');
const applicationModel = require('../models/applicationModel');
const { parseId } = require('../utils/currentUser');
const { randomUUID } = require('crypto');

const getImageType = (buffer) => {
    if (buffer.length >= 8
        && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47
        && buffer[4] === 0x0d && buffer[5] === 0x0a && buffer[6] === 0x1a && buffer[7] === 0x0a) {
        return { mime: 'image/png', extension: 'png' };
    }
    if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mime: 'image/jpeg', extension: 'jpg' };
    }
    if (buffer.length >= 12
        && buffer.toString('ascii', 0, 4) === 'RIFF'
        && buffer.toString('ascii', 8, 12) === 'WEBP') {
        return { mime: 'image/webp', extension: 'webp' };
    }
    return null;
};

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

exports.updateProfileImage = async (req, res) => {
    if (!req.file) {
        req.flash('เลือกรูป JPG, PNG หรือ WebP ก่อนอัปโหลด');
        return res.redirect('/profile/edit');
    }

    const imageType = getImageType(req.file.buffer);
    if (!imageType || imageType.mime !== req.file.mimetype) {
        req.flash('ไฟล์ที่เลือกไม่ใช่รูป JPG, PNG หรือ WebP ที่รองรับ');
        return res.redirect('/profile/edit');
    }

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, '');
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'avatars';
    if (!supabaseUrl || !serviceKey) {
        console.error('Profile image upload requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
        req.flash('ระบบอัปโหลดรูปยังตั้งค่าไม่ครบ');
        return res.redirect('/profile/edit');
    }

    const userId = req.user.user_id;
    const objectPath = `${userId}/${randomUUID()}.${imageType.extension}`;
    const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
    const storageBaseUrl = `${supabaseUrl}/storage/v1/object`;

    try {
        const uploadResponse = await fetch(
            `${storageBaseUrl}/${encodeURIComponent(bucket)}/${encodedPath}`,
            {
                method: 'POST',
                headers: {
                    apikey: serviceKey,
                    Authorization: `Bearer ${serviceKey}`,
                    'Content-Type': imageType.mime,
                    'Cache-Control': 'public, max-age=31536000, immutable'
                },
                body: req.file.buffer
            }
        );

        if (!uploadResponse.ok) {
            console.error('Supabase Storage upload failed:', uploadResponse.status);
            req.flash('อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่');
            return res.redirect('/profile/edit');
        }

        const publicUrl = `${storageBaseUrl}/public/${encodeURIComponent(bucket)}/${encodedPath}`;
        await userModel.updateProfile(userId, publicUrl);
        req.flash('เปลี่ยนรูปโปรไฟล์แล้ว');
        return res.redirect('/profile');
    } catch (err) {
        console.error('update profile image error:', err);
        req.flash('บันทึกรูปโปรไฟล์ไม่สำเร็จ');
        return res.redirect('/profile/edit');
    }
};
