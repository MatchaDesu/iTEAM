const userModel = require('../models/userModel');
const { comparePassword } = require('../utils/password');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const regenerateSession = (req) =>
    new Promise((resolve, reject) => req.session.regenerate((err) => (err ? reject(err) : resolve())));

const saveSession = (req) =>
    new Promise((resolve, reject) => req.session.save((err) => (err ? reject(err) : resolve())));

// รับเฉพาะ string แล้วตัดช่องว่าง (กัน client ส่งอาร์เรย์/อ็อบเจกต์มา)
const str = (value) => (typeof value === 'string' ? value.trim() : '');

// แจ้งข้อความแล้วกลับไปหน้าเดิม
const fail = (req, res, path, message) => {
    req.flash(message);
    return res.redirect(path);
};
// GET /auth/login
exports.showLogin = (req, res) => {
    if (req.user) return res.redirect('/');
    return res.render('auth/signIn', { layout: 'layouts/auth' });
};

// GET /auth/signup
exports.showSignup = (req, res) => {
    if (req.user) return res.redirect('/');
    return res.render('auth/signUp', { layout: 'layouts/auth' });
};

// POST /auth/signup
exports.register = async (req, res) => {
    const body = req.body || {};
    const username = str(body.username);
    const first_name = str(body.first_name);
    const last_name = str(body.last_name);
    const email = str(body.email).toLowerCase();
    const phone = str(body.phone);
    const github = str(body.github) || null; // github เป็น UNIQUE: ค่าว่างต้องเป็น null
    const password = typeof body.password === 'string' ? body.password : '';

    const back = '/auth/signup';

    // phone เป็น NOT NULL ใน database.sql จึงต้องบังคับกรอก
    if (!username || !first_name || !last_name || !email || !phone || !password) {
        return fail(req, res, back, 'กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น');
    }
    if (username.length > 30) {
        return fail(req, res, back, 'username ต้องไม่เกิน 30 ตัวอักษร');
    }
    if (phone.length > 15) {
        return fail(req, res, back, 'เบอร์โทรต้องไม่เกิน 15 ตัวอักษร');
    }
    if (!EMAIL_REGEX.test(email)) {
        return fail(req, res, back, 'รูปแบบอีเมลไม่ถูกต้อง');
    }
    if (password.length < 8) {
        return fail(req, res, back, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
    }
    if (password.length > 72) {
        // bcrypt ใช้ได้สูงสุด 72 ไบต์
        return fail(req, res, back, 'รหัสผ่านต้องไม่เกิน 72 ตัวอักษร');
    }

    try {
        if (await userModel.getByEmail(email)) {
            return fail(req, res, back, 'อีเมลนี้ถูกใช้งานแล้ว');
        }

        await userModel.createUser({
            username, first_name, last_name, email, github, phone, password
        });

        req.flash('สมัครสมาชิกสำเร็จ เข้าสู่ระบบได้เลย');
        return res.redirect('/auth/login');
    } catch (err) {
        // 23505 = unique_violation ของ PostgreSQL (เช่น username หรือ github ซ้ำ)
        if (err.code === '23505') {
            return fail(req, res, back, 'username, อีเมล หรือ GitHub นี้ถูกใช้งานแล้ว');
        }
        console.error('register error:', err);
        return fail(req, res, back, 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่');
    }
};

// POST /auth/login
exports.login = async (req, res) => {
    const body = req.body || {};
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === 'string' ? body.password : '';

    const back = '/auth/login';

    if (!email || !password) {
        return fail(req, res, back, 'กรุณากรอกอีเมลและรหัสผ่าน');
    }

    try {
        const user = await userModel.getByEmail(email);

        // บัญชีที่ถูก soft delete แล้วต้องไม่สามารถเข้าสู่ระบบได้
        const isMatch =
            user && !user.deleted_at && (await comparePassword(password, user.password));

        // ตอบข้อความเดียวกัน ไม่บอกว่าผิดที่อีเมลหรือรหัสผ่าน
        if (!isMatch) {
            return fail(req, res, back, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }

        // สร้าง session ID ใหม่ทุกครั้งที่ล็อกอิน (กัน session fixation)
        await regenerateSession(req);
        req.session.user = { user_id: user.user_id };
        req.flash(`ยินดีต้อนรับ ${user.first_name}`);
        await saveSession(req);

        return res.redirect('/');
    } catch (err) {
        console.error('login error:', err);
        return fail(req, res, back, 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่');
    }
};

// POST /auth/logout
exports.logout = async (req, res) => {
    try {
        await regenerateSession(req); // ล้างข้อมูลล็อกอินทั้งหมด
        req.flash('ออกจากระบบแล้ว');
        await saveSession(req);
    } catch (err) {
        console.error('logout error:', err);
    }
    return res.redirect('/');
};
