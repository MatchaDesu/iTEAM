
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

// สร้าง Salt และ Hash Password
exports.hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return await bcrypt.hash(password, salt);
};

// ตรวจสอบ Password
exports.comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};
