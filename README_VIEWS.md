# คู่มือเชื่อมต่อ Frontend (EJS Views) กับ Backend (PostgreSQL) — โปรเจกต์ iTEAM

ไฟล์ในโฟลเดอร์ `views/` ถูกออกแบบให้รองรับชื่อคอลัมน์จาก PostgreSQL โดยตรงผ่าน **Data Adapter** ที่อยู่ด้านบนสุดของแต่ละไฟล์ ฝั่ง Backend สามารถส่งผลลัพธ์จากการ Query เข้า `res.render()` ตามตารางด้านล่างนี้ได้เลยโดยไม่ต้องแก้โค้ด HTML

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

## 2. ตัวแปรที่ Backend ต้องส่งให้แต่ละหน้า (`res.render`)

> **หมายเหตุ:** ตัวแปร `user` (ข้อมูลคนที่ล็อกอินอยู่) และ `active` (ชื่อเมนูที่กำลังเปิด) ควรส่งผ่าน `res.locals` ใน Middleware กลางเพื่อให้ `header.ejs` ใช้ได้ทุกหน้า

| หน้าเว็บ (`View`) | ตัวแปรที่ต้องส่ง (`locals`) | คอลัมน์ที่คาดหวังจาก PostgreSQL |
| :--- | :--- | :--- |
| **`teams/index`** | `teams`, `categories` | `teams`: `team_id`, `team_name`, `description`, `category_name`, `max_members`, `status`<br>`categories`: `category_id`, `category_name` |
| **`teams/detail`** | `team`, `members`, `myApplication` | `team`: `team_id`, `team_name`, `description`, `category_name`, `max_members`, `status`, `created_by`<br>`members`: Array ของ `{ user_id, first_name, last_name, username, skills, team_role }`<br>`myApplication`: `{ status }` (ส่ง `null` ถ้ายังไม่เคยสมัคร) |
| **`leader/create-team`** | `categories`, `users` | `categories`: Array ของ `{ category_id, category_name }`<br>`users`: รายชื่อผู้ใช้ทั้งหมด `{ user_id, first_name, last_name, username, email, skills }` *(ใช้ในช่องค้นหาเพิ่มคน)* |
| **`users/profile`** | `user`, `teams` | `user`: `user_id`, `username`, `first_name`, `last_name`, `email`, `phone`, `github`, `skills`, `bio`<br>`teams`: Array ของทีมที่สังกัด พร้อมคอลัมน์ `team_role` (`'leader'` หรือ `'member'`) |
| **`users/show`** | `profileUser`, `teams` | โครงสร้างเหมือน `users/profile` แต่ใช้ชื่อตัวแปร `profileUser` สำหรับเจ้าของโปรไฟล์ที่กำลังเปิดดู |
| **`users/edit`** | `user` | ใช้ข้อมูล `user` ชุดเดียวกับหน้าโปรไฟล์ |
| **`applications/index`** | `applications` | Array ของ `{ application_id, team_id, team_name, category_name, message, status }` |

---

## 3. เส้นทางรับข้อมูลจากฟอร์ม (`POST` Endpoints & `req.body`)

เมื่อเลิกใช้ `preview.js` (ไม่มีตัวแปร `locals.db`) ฟอร์มในหน้าเว็บจะยิงไปที่ URL มาตรฐานเหล่านี้โดยอัตโนมัติ:

### 3.1 สร้างทีมใหม่ (`POST /teams`) — จาก `leader/create-team.ejs`
* `req.body.team_name`: ชื่อทีม (`String`)
* `req.body.category_id`: รหัสหมวดหมู่ (`String / Int`)
* `req.body.max_members`: จำนวนสมาชิกสูงสุด (`Number`)
* `req.body.description`: รายละเอียดทีม (`String`)
* `req.body.roles`: ทักษะที่หาเป็นพิเศษ คั่นด้วยจุลภาค เช่น `"Figma, Node.js"` (`String`)
* `req.body.initial_members`: **JSON String** ของสมาชิกที่เพิ่มตอนสร้างทีม
  * **วิธีใช้งานฝั่ง Backend:** ต้องสั่ง `const members = JSON.parse(req.body.initial_members || '[]')` ก่อนนำไปวนลูป
  * โครงสร้างข้างในจะเป็น:
    * สมาชิกในระบบ: `{ type: 'registered', user_id: 2, name: '...', email: '...', team_role: 'member' }`
    * บุคคลภายนอก: `{ type: 'external', name: '...', email: '...', team_role: 'member' }`

### 3.2 แก้ไขโปรไฟล์ (`POST /profile`) — จาก `users/edit.ejs`
* `req.body`: `{ username, first_name, last_name, email, phone, github, skills, bio }`
* ค่า `skills` จะถูกหน้าเว็บแปลงจากป้ายแท็กให้เป็นข้อความคั่นด้วยจุลภาค (เช่น `"JavaScript, Figma"`) พร้อมบันทึกเข้าคอลัมน์ `skills` ทันที

### 3.3 ส่งคำขอเข้าร่วมทีม (`POST /application`) — จาก `teams/detail.ejs`
* `req.body`: `{ team_id, message }`

### 3.4 ยกเลิกใบสมัคร (`POST /application/:id/cancel`) — จาก `applications/index.ejs`
* รับ `req.params.id` คือ `application_id` เพื่อเปลี่ยนสถานะหรือลบรายการ

---

## 4. กฎการแก้ไข CSS (`public/css/style.css`)

* ไฟล์ `style.css` ถูกจัดเรียงไว้เป็น **9 หมวดหมู่** (มีคอมเมนต์หัวข้อชัดเจน)
* สีทั้งหมดใช้ตัวแปร CSS (`--bg`, `--sf`, `--ink`, `--mu`, `--bl`, `--sk`, `--ln`) ห้ามใส่โค้ดสีตายตัว เพื่อให้รองรับทั้งโหมดสว่างและโหมดมืดอัตโนมัติ
* คลาสขึ้นต้นด้วย `.pf-` ใช้ร่วมกันในหน้าโปรไฟล์และหน้ารายละเอียดทีม ส่วน `.ct-` ใช้สำหรับฟอร์มสร้างทีมและป้ายแท็กทักษะ
