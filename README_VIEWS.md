# คู่มือเชื่อมต่อ Frontend (EJS Views) กับ Backend (PostgreSQL) — โปรเจกต์ iTEAM

> **บริบทและคำสั่งสำหรับทีมพัฒนา / AI:**  
> ฝั่ง Frontend (`views/` และ `public/css/style.css`) เสร็จสมบูรณ์แล้ว โดยมี **Data Adapter** ที่หัวไฟล์ EJS ทุกหน้าเพื่อรองรับชื่อคอลัมน์จาก PostgreSQL โดยตรง **ไม่ต้องแก้ไขโค้ด HTML/CSS ในโฟลเดอร์ `views/`** ให้เขียนเฉพาะโค้ดฝั่ง Backend (SQL Migration, Routes, Controllers) ให้ทำงานตรงตามสเปกด้านล่างนี้

---

## 1. โครงสร้างไฟล์หน้าเว็บ (`views/`)

| ไฟล์ EJS | หน้าที่ของหน้าเว็บ |
| :--- | :--- |
| `layouts/main.ejs` | โครงหลักของทุกหน้า (โหลด CSS, Header, Footer) |
| `partials/header.ejs` | แถบเมนูด้านบน แจ้งเตือน และดรอปดาวน์โปรไฟล์ |
| `home.ejs` | หน้าแรก (Hero Banner, ขั้นตอนการใช้งาน, ทีมแนะนำ) |
| `about.ejs` | หน้าเกี่ยวกับเรา |
| `teams/index.ejs` | หน้าค้นหาทีม + ตัวกรองหมวดหมู่ |
| `teams/detail.ejs` | หน้ารายละเอียดทีม + ฟอร์มส่งคำขอเข้าร่วมทีม |
| `leader/my-teams.ejs` | หน้าจัดการทีมของฉัน (สำหรับหัวหน้าทีม) |
| `leader/create-team.ejs` | หน้าฟอร์มสร้างทีมใหม่ + เพิ่มทักษะ + เพิ่มสมาชิกเริ่มต้น |
| `users/profile.ejs` | หน้าโปรไฟล์ของฉัน (แสดงข้อมูลส่วนตัว, ทักษะ, ทีมที่อยู่) |
| `users/edit.ejs` | หน้าแก้ไขโปรไฟล์ (เพิ่ม/ลบทักษะแบบป้ายแท็ก) |
| `users/show.ejs` | หน้าดูโปรไฟล์ของสมาชิกคนอื่น |
| `applications/index.ejs` | หน้าใบสมัครของฉัน (คลิกการ์ดเพื่อไปหน้ารายละเอียดทีมได้) |

---

## 2. Database Schema & ข้อเสนอแนะเพิ่มเติม (PostgreSQL)

### 2.1 ตารางที่มีอยู่แล้ว
* **`users`**: `user_id`, `username`, `password`, `first_name`, `last_name`, `email`, `github`, `phone`, `profile_image`, `role` (`'member'`, `'admin'`), `created_at`, `deleted_at`
* **`categories`**: `category_id`, `category_name`
* **`teams`**: `team_id`, `team_name`, `description`, `category_id`, `created_by`, `created_at`, `updated_at`
* **`team_members`**: `team_id`, `user_id`, `team_role` (`'leader'`, `'member'`), `joined_at`
* **`applications`**: `application_id`, `user_id`, `team_id`, `message`, `status` (`'pending'`, `'approved'`, `'rejected'`), `applied_at`, `reviewed_by`, `reviewed_at`

### 2.2 ข้อเสนอแนะที่ควรเพิ่มใน PostgreSQL เพื่อให้รองรับ UI ได้ 100%

1. **เพิ่มคอลัมน์ `skills` และ `bio` ในตาราง `users`** (รองรับหน้าแก้ไขโปรไฟล์, หน้าโปรไฟล์ และรายชื่อสมาชิกในทีม):
   ```sql
   ALTER TABLE users
     ADD COLUMN IF NOT EXISTS skills TEXT,
     ADD COLUMN IF NOT EXISTS bio TEXT;

 * เพิ่มคอลัมน์ max_members, status และ roles ในตาราง teams (รองรับการกำหนดจำนวนสมาชิกสูงสุด, แท็กทักษะที่หา และเช็กสถานะเปิด/ปิดรับสมัคร หากไม่เพิ่ม หน้าเว็บจะใช้ค่าเริ่มต้น 5 คน และ status = 'open' เสมอ):
   ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS max_members INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('open', 'closed')) DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS roles TEXT;

 * การจัดการ "บุคคลภายนอก" ตอนสร้างทีม (initial_members):
   เนื่องจาก team_members บังคับ user_id NOT NULL (ต้องเป็นสมาชิกในระบบเท่านั้น) เลือกจัดการได้ 2 แนวทาง:
   * แนวทาง A (แนะนำ): วนลูปบันทึกเฉพาะรายการที่ type === 'registered' ลงตาราง team_members ส่วนรายชื่อบุคคลภายนอกให้ข้ามไปก่อนจนกว่าคนนั้นจะสมัครสมาชิกในระบบ
   * แนวทาง B (เก็บข้อมูลคนนอกด้วย): สร้างตารางเสริมเพื่อเก็บรายชื่อบุคคลภายนอกแยกต่างหาก:
     CREATE TABLE IF NOT EXISTS team_external_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(team_id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    email TEXT
);

 * Logic ตอนหัวหน้าทีมกดอนุมัติใบสมัคร (status = 'approved'):
   ควรทำใน Transaction เดียวกัน: อัปเดต applications.status = 'approved' → INSERT ลง team_members → นับจำนวนสมาชิกในทีม ถ้าครบ max_members แล้วให้ UPDATE teams SET status = 'closed' อัตโนมัติ
3. ตัวแปรที่ Backend ต้องส่งให้แต่ละหน้า (res.locals & res.render)
> Middleware กลาง (res.locals ทุกหน้า):
>  * user: ข้อมูลผู้ใช้ที่ล็อกอินอยู่ (user_id, username, first_name, last_name, email, github, phone, profile_image, skills, bio, role) หรือ null
>  * active: ชื่อเมนูปัจจุบัน ('home', 'teams', 'applications', 'leader', 'profile')
> 
| หน้าเว็บ (View) | ตัวแปรที่ต้องส่ง (locals) | คอลัมน์ที่คาดหวังจาก PostgreSQL |
|---|---|---|
| teams/index | teams, categories | teams: JOIN categories เพื่อส่ง team_id, team_name, description, category_name, max_members, status
categories: category_id, category_name |
| teams/detail | team, members, myApplication | team: JOIN categories เพื่อส่ง team_id, team_name, description, category_name, max_members, status, created_by
members: JOIN team_members กับ users เพื่อส่ง user_id, first_name, last_name, username, profile_image, skills, team_role
myApplication: ใบสมัครล่าสุดของ user_id กับ team_id (ส่ง { status } หรือ null ถ้ายังไม่เคยส่งคำขอ) |
| leader/create-team | categories, users | categories: category_id, category_name
users: SELECT user_id, first_name, last_name, username, email, skills FROM users WHERE deleted_at IS NULL (ใช้ในช่องค้นหาเพิ่มคน) |
| users/profile | user, teams | user: ข้อมูลผู้ใช้ปัจจุบัน
teams: JOIN team_members กับ teams และ LEFT JOIN categories เพื่อส่ง team_id, team_name, description, category_name, team_role ('leader' หรือ 'member') |
| users/show | profileUser, teams | โครงสร้างเหมือน users/profile แต่ใช้ชื่อตัวแปร profileUser สำหรับเจ้าของโปรไฟล์ที่กำลังเปิดดู |
| users/edit | user | ใช้ข้อมูล user ชุดเดียวกับหน้าโปรไฟล์ |
| applications/index | applications | JOIN applications กับ teams และ LEFT JOIN categories เพื่อส่ง application_id, team_id, team_name, category_name, message, status |
4. เส้นทางรับข้อมูลจากฟอร์ม (POST Endpoints & req.body)
เมื่อเลิกใช้ preview.js (ไม่มีตัวแปร locals.db) ฟอร์มในหน้าเว็บจะส่งข้อมูลไปที่ URL มาตรฐานเหล่านี้โดยอัตโนมัติ:
4.1 สร้างทีมใหม่ (POST /teams) — จาก leader/create-team.ejs
 * ค่าที่รับจาก req.body: team_name, category_id, max_members, description, roles (ข้อความคั่นด้วยจุลภาค เช่น "Figma, Node.js"), initial_members (JSON String)
 * โครงสร้าง initial_members หลังแปลงด้วย JSON.parse(req.body.initial_members || '[]'):
   * สมาชิกในระบบ: { type: 'registered', user_id: 2, name: '...', email: '...', team_role: 'member' }
   * บุคคลภายนอก: { type: 'external', name: '...', email: '...', team_role: 'member' }
 * ขั้นตอนบันทึก (แนะนำให้ใช้ Transaction):
   * บันทึกทีมลงตาราง teams (RETURNING team_id)
   * บันทึกผู้สร้างทีมลง team_members (team_role = 'leader')
   * วนลูป initial_members บันทึกสมาชิกลง team_members (team_role = 'member')
4.2 แก้ไขโปรไฟล์ (POST /profile) — จาก users/edit.ejs
 * ค่าที่รับจาก req.body: username, first_name, last_name, email, phone, github, skills (หน้าเว็บแปลงป้ายแท็กเป็นข้อความคั่นด้วยจุลภาคให้แล้ว), bio
4.3 ส่งคำขอเข้าร่วมทีม (POST /application) — จาก teams/detail.ejs
 * ค่าที่รับจาก req.body: team_id, message
 * ข้อควรระวัง: ดัก Error กรณีผู้ใช้ส่งคำขอซ้ำขณะที่ยังมีสถานะ 'pending' (ติด Unique Index unique_pending_application)
4.4 ยกเลิกใบสมัคร (POST /application/:id/cancel) — จาก applications/index.ejs
 * รับ req.params.id คือ application_id เพื่อลบหรือยกเลิกเฉพาะรายการของ user_id ที่ยังอยู่ในสถานะ 'pending'
5. กฎการแก้ไข CSS (public/css/style.css)
 * ไฟล์ style.css จัดเรียงไว้เป็น 9 หมวดหมู่ (มีคอมเมนต์หัวข้อกำกับชัดเจน)
 * สีทั้งหมดใช้ตัวแปร CSS (--bg, --sf, --ink, --mu, --bl, --sk, --ln) ห้ามใส่โค้ดสีตายตัว เพื่อให้รองรับทั้งโหมดสว่างและโหมดมืดอัตโนมัติ
 * คลาสขึ้นต้นด้วย .pf- ใช้ร่วมกันในหน้าโปรไฟล์และหน้ารายละเอียดทีม ส่วน .ct- ใช้สำหรับฟอร์มสร้างทีมและป้ายแท็กทักษะ

