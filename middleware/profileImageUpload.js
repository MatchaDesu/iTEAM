const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: (req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        callback(null, allowedTypes.includes(file.mimetype));
    }
});

module.exports = (req, res, next) => {
    upload.single('profile_image')(req, res, (err) => {
        if (err) {
            req.flash(err.code === 'LIMIT_FILE_SIZE'
                ? 'รูปต้องมีขนาดไม่เกิน 5 MB'
                : 'อัปโหลดรูปไม่สำเร็จ');
            return res.redirect('/profile/edit');
        }
        return next();
    });
};
