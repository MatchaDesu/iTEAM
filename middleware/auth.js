// ต้องล็อกอินก่อน (req.user ถูกตั้งโดย attachUser)
exports.authenticate = (req, res, next) => {
    if (req.user) return next();
    req.flash('กรุณาเข้าสู่ระบบก่อน');
    return res.redirect('/auth/login');
};

// จำกัดตามบทบาท เช่น requireRole('admin')  (ใช้หลัง authenticate)
exports.requireRole = (...roles) => (req, res, next) => {
    if (req.user && roles.includes(req.user.role)) return next();
    req.flash('ไม่มีสิทธิ์เข้าถึงหน้านี้');
    return res.redirect('/');
};
