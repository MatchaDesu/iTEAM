// ข้อความแจ้งเตือนครั้งเดียว (แสดงที่ footer.ejs ผ่านตัวแปร flash)
// ใช้: req.flash('ข้อความ'); แล้ว res.redirect(...)
module.exports = (req, res, next) => {
    req.flash = (message) => {
        req.session.flash = message;
    };

    res.locals.flash = req.session.flash || null;
    delete req.session.flash;

    next();
};
