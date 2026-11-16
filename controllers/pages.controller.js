// หน้าทั่วไป (ไม่ต้องล็อกอิน)
// active = ชื่อแท็บที่ header.ejs จะไฮไลต์

exports.home = (req, res) => {
    res.render('pages/home', { active: 'home' });
};

exports.about = (req, res) => {
    res.render('pages/about', { active: 'about' });
};

exports.guide = (req, res) => {
    res.render('pages/guide', { active: 'guide' });
};

