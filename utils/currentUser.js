// ดึง user_id ของคนที่เรียก API
// TODO: เมื่อมี auth middleware แล้ว ให้ใช้ req.user.user_id อย่างเดียว และลบ fallback จาก body/query
//       (ตอนนี้ client ส่ง user_id มาเองได้ ซึ่งปลอมได้ ใช้ได้เฉพาะช่วงพัฒนา)
exports.getCurrentUserId = (req) => {
    const raw = req.user?.user_id ?? req.body?.user_id ?? req.query?.user_id;
    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
};

exports.parseId = (value) => {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
};