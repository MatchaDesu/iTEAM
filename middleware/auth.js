// ต้องล็อกอินก่อน
exports.authenticate = (req, res, next) => {
    const user = req.session?.user;
    if (!user) {
        return res.status(401).json({ message: 'กรุณาเข้าสู่ระบบ' });
    }
    req.user = user; // { user_id, role }
    next();
};

// จำกัดตามบทบาท เช่น requireRole('admin')  (ใช้หลัง authenticate)
exports.requireRole = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
        return res.status(403).json({ message: 'ไม่มีสิทธิ์เข้าถึง' });
    }
    next();
};