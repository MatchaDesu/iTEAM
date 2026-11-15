const userModel = require('../models/userModel');
const { comparePassword } = require('../utils/password');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ตัด password ออกก่อนส่งกลับไปให้ client
const toPublicUser = (user) => {
    const { password, ...rest } = user;
    return rest;
};

// POST /auth/register
exports.register = async (req, res) => {
    const { username, first_name, last_name, email, github, phone, password } = req.body || {};

    // phone เป็น NOT NULL ใน database.sql จึงต้องบังคับกรอก
    if (!username || !first_name || !last_name || !email || !phone || !password) {
        return res.status(400).json({
            message: 'กรุณากรอก username, first_name, last_name, email, phone และ password ให้ครบ'
        });
    }
    if (username.trim().length > 30) {
        return res.status(400).json({ message: 'username ต้องไม่เกิน 30 ตัวอักษร' });
    }
    if (String(phone).trim().length > 15) {
        return res.status(400).json({ message: 'เบอร์โทรต้องไม่เกิน 15 ตัวอักษร' });
    }
    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'password ต้องมีอย่างน้อย 8 ตัวอักษร' });
    }

    try {
        const normalizedEmail = email.trim().toLowerCase();

        const existing = await userModel.getByEmail(normalizedEmail);
        if (existing) {
            return res.status(409).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const { user_id } = await userModel.createUser({
            username: username.trim(),
            first_name: first_name.trim(),
            last_name: last_name.trim(),
            email: normalizedEmail,
            // github เป็น UNIQUE: ส่งค่าว่างเข้าไปจะชนกันเอง จึงแปลงเป็น null
            github: github && github.trim() ? github.trim() : null,
            phone: String(phone).trim(),
            password
        });

        const user = await userModel.getById(user_id);
        return res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ', user });
    } catch (err) {
        // 23505 = unique_violation ของ PostgreSQL (เช่น username ซ้ำ)
        if (err.code === '23505') {
            return res.status(409).json({ message: 'username หรืออีเมลนี้ถูกใช้งานแล้ว' });
        }
        console.error('register error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};

// POST /auth/login
exports.login = async (req, res) => {
    const { email, password } = req.body || {};

    if (!email || !password) {
        return res.status(400).json({ message: 'กรุณากรอก email และ password' });
    }

    try {
        const user = await userModel.getByEmail(email.trim().toLowerCase());

        // บัญชีที่ถูก soft delete แล้วต้องไม่สามารถเข้าสู่ระบบได้
        const isMatch =
            user && !user.deleted_at && (await comparePassword(password, user.password));

        // ตอบข้อความเดียวกัน ไม่บอกว่าผิดที่ email หรือ password
        if (!isMatch) {
            return res.status(401).json({ message: 'email หรือ password ไม่ถูกต้อง' });
        }

        // TODO: ออก token / สร้าง session ตรงนี้
        return res.json({ message: 'เข้าสู่ระบบสำเร็จ', user: toPublicUser(user) });
    } catch (err) {
        console.error('login error:', err);
        return res.status(500).json({ message: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์' });
    }
};