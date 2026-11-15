const session = require('express-session');

const COOKIE_NAME = 'iteam.sid';
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.SESSION_SECRET) {
    throw new Error('ไม่พบ SESSION_SECRET ในไฟล์ .env');
}

// ตอนนี้เก็บ session ในหน่วยความจำ (MemoryStore) เหมาะกับช่วงพัฒนา
// ก่อน deploy ควรเปลี่ยนไปใช้ store จริง เช่น connect-pg-simple
const sessionMiddleware = session({
    name: COOKIE_NAME,
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,                 // JavaScript ฝั่ง browser อ่าน cookie ไม่ได้
        sameSite: 'lax',                // กัน CSRF เบื้องต้น
        secure: isProd,                 // production ต้องใช้ HTTPS
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 วัน
    }
});

module.exports = { sessionMiddleware, COOKIE_NAME };