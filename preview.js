/*ข้อควรรู้เล็กน้อยสำหรับคนที่จะเอาโค้ดนี้ไปเขียนเชื่อม Backend ต่อ เพื่อให้ทำงานได้ราบรื่นตั้งแต่รอบแรก:

หน้าสร้างทีม (POST /teams): ช่องทักษะที่หาเป็นพิเศษ (roles) จะส่งไปเป็นข้อความคั่นด้วยจุลภาค (เช่น "Figma, Node.js") 
ส่วนรายชื่อสมาชิกเริ่มต้น (initial_members) จะส่งไปเป็น JSON String ซึ่งฝั่ง Controller ต้องสั่ง JSON.parse(req.body.initial_members) 
ก่อนนำไปวนลูปเพิ่มลงตาราง team_members

หน้าเปิดฟอร์มสร้างทีม (GET /leader/teams/new): นอกจากส่ง categories แล้ว อย่าลืมส่งรายชื่อผู้ใช้ users เข้ามาใน res.render() ด้วย 
เพื่อให้ระบบค้นหา "เพิ่มสมาชิกในระบบ" มีข้อมูลแสดงขึ้นมาให้เลือก

หน้าแก้ไขโปรไฟล์ (POST /profile): แม้หน้าเว็บจะแสดงทักษะเป็นป้ายแท็กให้กดเพิ่ม/ลบได้ แต่ตอนกดบันทึก 
ฟอร์มจะรวมค่าทั้งหมดใส่ฟิลด์ skills เป็นข้อความคั่นด้วยจุลภาคให้เหมือนเดิม จึงใช้โค้ดอัปเดตฐานข้อมูลแบบปกติได้เลย
*/

// preview.js — เซิร์ฟเวอร์สำหรับ "ดูหน้าตา" views ด้วยข้อมูลจำลอง (ไม่ต่อฐานข้อมูล)
// รัน: node preview.js  แล้วเปิด http://localhost:3000
// สลับบทบาท: /?role=guest | /?role=user | /?role=admin
const express = require('express');
const expressEjsLayouts = require('express-ejs-layouts');
const path = require('path');

const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// เสิร์ฟเฉพาะ public เท่านั้น (ห้ามเสิร์ฟทั้งโฟลเดอร์ เพราะจะเปิดโค้ด/config ให้ดาวน์โหลดได้)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // อ่านค่าจากฟอร์ม (req.body)
app.use(expressEjsLayouts);
app.set('layout', 'layouts/main');

// ---------- ข้อมูลจำลอง (โครงสร้างตรงกับที่ views ใช้) ----------
const users = [
  { id: 1, name: 'สมชาย ใจดี', email: 'somchai@example.com', role: 'member', skills: 'JavaScript, Node.js, EJS, CSS', bio: 'นักพัฒนาเว็บ Full-stack ชอบทำโปรเจกต์ Hackathon', suspended: false },
  { id: 2, name: 'แอดมิน ระบบ', email: 'admin@example.com', role: 'admin', skills: 'Management', bio: 'ผู้ดูแลระบบ iTEAM', suspended: false },
  { id: 3, name: 'มาลี รักเรียน', email: 'malee@example.com', role: 'member', skills: 'UI Design, Figma', bio: '', suspended: false },
  { id: 4, name: 'ปิติ ใจเย็น', email: 'piti@example.com', role: 'member', skills: '', bio: '', suspended: true }
];
const cats = ['Hackathon', 'โปรเจกต์มหาวิทยาลัย', 'กิจกรรมการแข่งขัน', 'โปรเจกต์ส่วนตัว'];
const teams = [
  { id: 1, name: 'ทีมพัฒนาแพลตฟอร์ม iTEAM', cat: 'โปรเจกต์มหาวิทยาลัย', desc: 'สร้างเว็บจับคู่คนกับทีม', max: 5, leader: 1, members: [1, 3], roles: ['Frontend', 'Backend'], title: 'รับ Frontend / UI Designer', open: true, status: 'approved', reason: '', hidden: false },
  { id: 2, name: 'Hackathon Rocket', cat: 'Hackathon', desc: 'แข่ง Hackathon ปลายปี', max: 4, leader: 1, members: [1], roles: ['AI/ML'], title: 'หา AI Engineer 1 ตำแหน่ง', open: true, status: 'pending', reason: '', hidden: false },
  { id: 3, name: 'Design Squad', cat: 'โปรเจกต์ส่วนตัว', desc: 'ทีมออกแบบ UX', max: 3, leader: 3, members: [3], roles: ['UX Researcher'], title: 'โพสต์ถูกถอด', open: false, status: 'removed', reason: 'ข้อมูลไม่ครบ', hidden: false }
];
const apps = [
  { id: 1, user: 3, team: 2, msg: 'สนใจเป็น Designer ค่ะ', status: 'pending' },
  { id: 2, user: 1, team: 3, msg: '', status: 'rejected' },
  { id: 3, user: 4, team: 1, msg: 'อยากร่วมทีม', status: 'accepted' }
];
const notes = [
  { id: 1, text: 'มีผู้สมัครใหม่ในทีม Hackathon Rocket', read: false },
  { id: 2, text: 'ใบสมัครของคุณถูกปฏิเสธ', read: true }
];

// ---------- ตัวช่วยที่ views เรียกใช้ ----------
const ST = { pending: 'รอพิจารณา', accepted: 'ได้รับการตอบรับ', rejected: 'ไม่ผ่าน' };
const uname = id => (users.find(u => u.id === id) || { name: '(ไม่พบผู้ใช้)' }).name;
const db = { users, teams, apps };

let currentRole = 'user';

app.use((req, res, next) => {
  if (['guest', 'user', 'admin'].includes(req.query.role)) currentRole = req.query.role;
  const user = currentRole === 'guest' ? null : currentRole === 'admin' ? users[1] : users[0];

  Object.assign(res.locals, {
    user, db, cats, ST, uname,
    active: 'home',
    unread: notes.filter(n => !n.read).length,
    pendingPosts: teams.filter(t => t.status === 'pending').length,
    flash: null,
    q: '', cat: ''
  });
  next();
});

app.use((req, res, next) => {
  if (res.locals.user?.role === 'admin'
      && !req.path.startsWith('/admin')
      && req.path !== '/logout') return res.redirect('/admin');
  next();
});

const visible = teams.filter(t => t.status === 'approved' && !t.hidden);

// ---------- หน้าทั่วไป ----------
app.get('/', (req, res) => res.render('pages/home', { active: 'home' }));
app.get('/guide', (req, res) => res.render('pages/guide', { active: 'guide' }));
app.get('/about', (req, res) => res.render('pages/about', { active: 'about' }));

// ---------- สมาชิก ----------
['/login', '/signin'].forEach(p => app.get(p, (req, res) => res.render('auth/signIn', { layout: 'layouts/auth' })));
['/register', '/signup'].forEach(p => app.get(p, (req, res) => res.render('auth/signUp', { layout: 'layouts/auth' })));
app.get('/logout', (req, res) => { currentRole = 'guest'; res.redirect('/'); });

app.get('/teams', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const cat = req.query.cat || '';
  const list = visible.filter(t =>
    (!cat || t.cat === cat) &&
    (!q || (t.name + t.desc + t.roles.join(' ')).toLowerCase().includes(q)));
  res.render('teams/explore', { active: 'search', teams: list, q: req.query.q || '', cat });
});

app.get('/teams/:id/apply', (req, res) => {
  if (!res.locals.user) return res.redirect('/login');
  const t = teams.find(x => x.id === +req.params.id);
  if (!t) return res.status(404).send('ไม่พบทีม');
  return res.render('teams/apply', { team: {
    team_id: t.id, team_name: t.name, category_name: t.cat, description: t.desc,
    member_count: t.members.length, max_members: t.max
  } });
});

app.get('/teams/:id', (req, res) => {
  const t = teams.find(x => x.id === +req.params.id);
  if (!t) return res.status(404).send('ไม่พบทีม');
  const u = res.locals.user;
  const myApp = u ? apps.find(a => a.user === u.id && a.team === t.id) : null;
  res.render('teams/detail', {
    active: 'search', t,
    isLeader: !!u && t.leader === u.id,
    isMember: !!u && t.members.includes(u.id),
    myApp,
    canApply: t.open && t.members.length < t.max
  });
});

app.get('/applications', (req, res) => {
  const u = res.locals.user;
  res.render('teams/applications', { active: 'apps', apps: u ? apps.filter(a => a.user === u.id) : [] });
});
app.get('/notifications', (req, res) => res.render('teams/notifications', { active: 'notes', list: notes }));
app.get('/profile', (req, res) => res.render('users/profile', { active: 'profile' }));
app.get('/profile/edit', (req, res) => res.render('users/edit', { active: 'profile' }));

// ---------- ดูโปรไฟล์ผู้อื่น ----------
app.get('/users/:id', (req, res) => {
  const profileUser = users.find(u => u.id === +req.params.id);
  if (!profileUser) return res.status(404).send('ไม่พบผู้ใช้งาน');
  res.render('users/detail_profile', {
    active: '',
    profileUser
  });
});


// ---------- หัวหน้าทีม ----------
app.get('/leader/teams', (req, res) => {
  const u = res.locals.user;
  const my = u ? teams.filter(t => t.leader === u.id) : [];
  const t = my.find(x => x.id === +req.query.team) || null;
  res.render('leader/my-teams', {
    active: 'manage', my, t,
    tab: ['info', 'post', 'appl', 'mem'].includes(req.query.tab) ? req.query.tab : 'info',
    apps: t ? apps.filter(a => a.team === t.id) : []
  });
});

['/leader/teams/new', '/leader/create-team'].forEach(p =>
  app.get(p, (req, res) => res.render('leader/create-team', { active: 'manage' })));

// ---------- แอดมิน ----------
app.get('/admin', (req, res) =>
  res.render('admin/dashboard', { active: 'dash', pending: teams.filter(t => t.status === 'pending') }));

app.get('/admin/users', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const f = req.query.f || '';
  const list = users.filter(u =>
    (!q || (u.name + u.email).toLowerCase().includes(q)) &&
    (f === '' || (f === 's') === u.suspended));
  list.sort((a, b) => Number(b.role === 'admin') - Number(a.role === 'admin'));
  res.render('admin/users', { active: 'users', users: list, q: req.query.q || '', f });
});

app.get('/admin/teams', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const cat = req.query.cat || '';
  const st = req.query.status || '';
  const list = teams.filter(t =>
    (!st || t.status === st) && (!cat || t.cat === cat) &&
    (!q || (t.name + uname(t.leader)).toLowerCase().includes(q)));
  res.render('admin/teams', { active: 'teams', teams: list, q: req.query.q || '', cat, st });
});

app.get('/admin/posts', (req, res) => res.redirect('/admin/teams'));

// จำลองล็อกอิน: ไม่ตรวจรหัสผ่านจริง แค่สลับบทบาทเพื่อดูหน้าเว็บ
// ใส่อีเมลที่มีคำว่า admin → เข้าเป็นแอดมิน นอกนั้นเป็นสมาชิก
app.post('/login', (req, res) => {
  currentRole = String(req.body.email || '').toLowerCase().includes('admin') ? 'admin' : 'user';
  res.redirect(currentRole === 'admin' ? '/admin' : '/');
});
app.post('/register', (req, res) => { currentRole = 'user'; res.redirect('/'); });

// ฟอร์ม POST ในโหมดพรีวิวไม่ทำอะไร แค่เด้งกลับหน้าเดิม
// (ไม่ใช้ app.post('*') เพราะ Express 5 ไม่รองรับเครื่องหมาย * เดี่ยวๆ)
app.use((req, res, next) => {
  if (req.method === 'POST') return res.redirect(req.get('referer') || '/');
  next();
});

app.listen(PORT, () => console.log(`เปิดดูหน้าเว็บได้เลยที่: http://localhost:${PORT}`));
