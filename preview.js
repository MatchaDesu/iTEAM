const express = require('express');
const expressEjsLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// เชื่อมไฟล์ CSS (/style.css) ไม่ว่าจะวางใน public หรือโฟลเดอร์หลัก
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));

app.use(expressEjsLayouts);
app.set('layout', 'layouts/main');

// เก็บสถานะบทบาทปัจจุบันสำหรับพรีวิว ('guest' | 'user' | 'admin')
let currentRole = 'user';

app.use((req, res, next) => {
  // สลับบทบาทได้ทันทีผ่าน URL เช่น http://localhost:3000/?role=admin
  if (req.query.role && ['guest', 'user', 'admin'].includes(req.query.role)) {
    currentRole = req.query.role;
  }

  const mockUsers = [
    {
      id: 1,
      name: 'สมชาย ใจดี',
      email: 'somchai@example.com',
      role: 'user',
      bio: 'นักพัฒนาเว็บ Full-stack ชอบทำโปรเจกต์ Hackathon',
      skills: ['JavaScript', 'Node.js', 'EJS', 'CSS'],
      suspended: false
    },
    {
      id: 2,
      name: 'แอดมิน ระบบ',
      email: 'admin@example.com',
      role: 'admin',
      bio: 'ผู้ดูแลระบบ iTEAM',
      skills: ['Management'],
      suspended: false
    }
  ];

  const activeUser =
    currentRole === 'guest' ? null :
    currentRole === 'admin' ? mockUsers[1] : mockUsers[0];

  const mockCats = ['Web Development', 'Mobile App', 'AI & Data', 'Design'];
  const mockTeams = [
    {
      id: 1,
      name: 'ทีมพัฒนาแพลตฟอร์ม iTEAM',
      cat: 'Web Development',
      description: 'รายละเอียดทีมตัวอย่างสำหรับทดสอบการแสดงผลหน้าเว็บ',
      status: 'open',
      maxMembers: 5,
      leaderId: 1,
      leader: mockUsers[0],
      members: mockUsers,
      roles: ['Frontend Developer', 'Backend Developer']
    }
  ];
  const mockPosts = [
    {
      id: 1,
      title: 'เปิดรับสมัคร Frontend / UI Designer ร่วมแข่ง Hackathon',
      teamId: 1,
      team: mockTeams[0],
      positions: ['Frontend', 'Designer'],
      status: 'pending',
      createdAt: '2026-11-15'
    }
  ];

  res.locals.currentUser = activeUser;
  res.locals.user = activeUser;
  res.locals.profile = mockUsers[0];
  res.locals.users = mockUsers;

  res.locals.cats = mockCats;
  res.locals.categories = mockCats;
  res.locals.teams = mockTeams;
  res.locals.team = mockTeams[0];
  res.locals.myTeams = mockTeams;
  res.locals.favorites = mockTeams;
  res.locals.favIds = [1];
  res.locals.posts = mockPosts;
  res.locals.applications = [];
  res.locals.notifications = [];

  res.locals.db = {
    users: mockUsers,
    teams: mockTeams,
    categories: mockCats,
    posts: mockPosts,
    applications: [],
    notifications: []
  };

  // ตัวแปรสำหรับ header.ejs และ footer.ejs
  res.locals.active = 'home';
  res.locals.unread = 2;
  res.locals.pendingPosts = 1;
  res.locals.title = 'iTEAM';
  res.locals.flash = null;
  res.locals.error = null;
  res.locals.success = null;
  res.locals.q = '';
  res.locals.cat = '';

  next();
});

// ==========================================
// ลิงก์ตรงตามเมนูใน header.ejs และทุกหน้าใน views/
// ==========================================

// 1. หน้าทั่วไป
app.get('/', (req, res) => res.render('pages/home', { active: 'home' }));
app.get('/guide', (req, res) => res.render('pages/guide', { active: 'guide' }));
app.get('/about', (req, res) => res.render('pages/about', { active: 'about' }));

// 2. ระบบสมาชิก (กดออกจากระบบจะสลับเป็นโหมด guest ทันที)
app.get('/login', (req, res) => res.render('auth/signIn', { layout: 'layouts/auth' }));
app.get('/signin', (req, res) => res.render('auth/signIn', { layout: 'layouts/auth' }));
app.get('/register', (req, res) => res.render('auth/signUp', { layout: 'layouts/auth' }));
app.get('/signup', (req, res) => res.render('auth/signUp', { layout: 'layouts/auth' }));
app.get('/logout', (req, res) => {
  currentRole = 'guest';
  res.redirect('/');
});

// 3. เมนูฝั่งสมาชิกทั่วไป (ตรงตาม href และ key ใน header.ejs)
app.get('/teams', (req, res) => res.render('teams/explore', { active: 'search' }));
app.get('/teams/detail', (req, res) => res.render('teams/detail', { active: 'search' }));
app.get('/favorites', (req, res) => res.render('teams/favorites', { active: 'favs' }));
app.get('/applications', (req, res) => res.render('teams/applications', { active: 'apps' }));
app.get('/notifications', (req, res) => res.render('teams/notifications', { active: 'notes' }));
app.get('/profile', (req, res) => res.render('users/profile', { active: 'profile' }));
app.get('/profile/edit', (req, res) => res.render('users/edit', { active: 'profile' }));

// 4. เมนูฝั่งหัวหน้าทีม
app.get('/leader/teams', (req, res) => res.render('leader/my-teams', { active: 'manage' }));
app.get('/leader/teams/new', (req, res) => res.render('leader/create-team', { active: 'manage' }));
app.get('/leader/create-team', (req, res) => res.render('leader/create-team', { active: 'manage' }));

// 5. เมนูฝั่งแอดมิน (ตรงตาม href และ key ใน header.ejs)
app.get('/admin', (req, res) => res.render('admin/dashboard', { active: 'dash' }));
app.get('/admin/users', (req, res) => res.render('admin/users', { active: 'users' }));
app.get('/admin/teams', (req, res) => res.render('admin/teams', { active: 'teams' }));
app.get('/admin/categories', (req, res) => res.render('admin/categories', { active: 'cats' }));
app.get('/admin/posts', (req, res) => res.render('admin/posts', { active: 'teams' }));

app.listen(PORT, () => {
  console.log(`เปิดดูหน้าเว็บได้เลยที่: http://localhost:${PORT}`);
});