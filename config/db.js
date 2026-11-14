const { Pool } = require('pg');

// กำหนดค่าการเชื่อมต่อ (ในโปรเจกต์จริง แนะนำให้ดึงค่าเหล่านี้จากไฟล์ .env)
const db = new Pool({
  user: 'postgres',           // ชื่อผู้ใช้ PostgreSQL (ค่าเริ่มต้นมักเป็น postgres)
  host: 'localhost',          // โฮสต์ที่รันฐานข้อมูล
  database: 'iTEAM_Database',  // ชื่อฐานข้อมูลที่คุณสร้างไว้
  password: '06082547',  // รหัสผ่าน
  port: 5432,                 // พอร์ตเริ่มต้นของ PostgreSQL
});

db.connect((err, client, release) => {
  if (err) {
    return console.error('Error connecting to PostgreSQL:', err.stack);
  }
  console.log('Connected to the PostgreSQL database.');
  
  release(); 
});

module.exports = db;