require('dotenv').config();

const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const { sessionMiddleware } = require('./config/session');
const flash = require('./middleware/flash');
const { attachUser } = require('./middleware/user');

const app = express();
const PORT = process.env.PORT || 3000;

// ถ้าอยู่หลัง proxy (เช่น Nginx, Render) cookie แบบ secure ถึงจะทำงาน
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public (css, images)
app.use(express.static(path.join(__dirname, 'public')));

// Session -> flash -> ผู้ใช้ที่ล็อกอิน (ต้องเรียงตามนี้)
app.use(sessionMiddleware);
app.use(flash);
app.use(attachUser);

// Admin accounts use the dedicated dashboard, not member pages.
app.use((req, res, next) => {
    if (req.user?.role === 'admin'
        && !req.path.startsWith('/admin')
        && !(req.method === 'POST' && req.path === '/auth/logout')) {
        return res.redirect('/admin');
    }
    return next();
});

// View engine + layouts (ค่าเริ่มต้น layouts/main, หน้า auth ระบุ layouts/auth เอง)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Routes
app.use('/', require('./routes/pages.routes'));
app.use('/auth', require('./routes/auth.routes'));
app.use('/users', require('./routes/user.routes'));
app.use('/leader', require('./routes/leader.routes'));
app.use('/favorites', require('./routes/favorite.routes'));
app.use('/notifications', require('./routes/notification.routes'));
app.use('/teams', require('./routes/team.routes'));
app.use('/application', require('./routes/application.routes'));
app.use('/admin', require('./routes/admin.routes'));

// 404
app.use((req, res) => {
    res.status(404).send('ไม่พบหน้าที่ต้องการ');
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
