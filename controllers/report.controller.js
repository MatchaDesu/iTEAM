const reportModel = require('../models/reportModel');
const userModel = require('../models/userModel');
const teamModel = require('../models/teamModel');
const teamMemberModel = require('../models/teamMemberModel');
const { parseId } = require('../utils/currentUser');

const submit = async (req, res, targetType) => {
    const targetId = parseId(req.body?.target_id);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    const backUrl = targetType === 'user'
        ? `/users/${targetId || ''}`
        : `/teams/${targetId || ''}`;

    if (!targetId || !reason || reason.length > 1000) {
        req.flash('กรุณากรอกเหตุผลรายงาน (ไม่เกิน 1,000 ตัวอักษร)');
        return res.redirect(backUrl);
    }

    try {
        if (targetType === 'user') {
            if (Number(targetId) === Number(req.user.user_id)) {
                req.flash('ไม่สามารถรายงานโปรไฟล์ของตัวเองได้');
                return res.redirect(backUrl);
            }
            if (!(await userModel.getById(targetId))) {
                req.flash('ไม่พบผู้ใช้ที่ต้องการรายงาน');
                return res.redirect('/');
            }
            await reportModel.createUserReport({
                reporterId: req.user.user_id,
                reportedUserId: targetId,
                reason
            });
        } else {
            if (!(await teamModel.getById(targetId))) {
                req.flash('ไม่พบทีมที่ต้องการรายงาน');
                return res.redirect('/teams');
            }
            if (await teamMemberModel.checkMember(targetId, req.user.user_id)) {
                req.flash('รายงานได้เฉพาะทีมที่คุณไม่ได้เป็นสมาชิก');
                return res.redirect(backUrl);
            }
            await reportModel.createTeamReport({
                reporterId: req.user.user_id,
                teamId: targetId,
                reason
            });
        }

        req.flash('ส่งรายงานให้ผู้ดูแลแล้ว');
        return res.redirect(backUrl);
    } catch (err) {
        console.error('submit report error:', err);
        req.flash('ส่งรายงานไม่สำเร็จ กรุณาลองใหม่');
        return res.redirect(backUrl);
    }
};

exports.reportUser = (req, res) => submit(req, res, 'user');
exports.reportTeam = (req, res) => submit(req, res, 'team');

exports.adminList = async (req, res) => {
    try {
        const reports = await reportModel.getAll();
        return res.render('admin/reports', { reports, active: 'reports' });
    } catch (err) {
        console.error('admin reports list error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.adminDetails = async (req, res) => {
    const reportId = parseId(req.params.reportId);
    if (!reportId) return res.redirect('/admin/reports');

    try {
        const report = await reportModel.getById(reportId);
        if (!report) {
            req.flash('ไม่พบรายงาน');
            return res.redirect('/admin/reports');
        }
        return res.render('admin/report-detail', { report, active: 'reports' });
    } catch (err) {
        console.error('admin report details error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.markHandled = async (req, res) => {
    const reportId = parseId(req.params.reportId);
    if (!reportId) {
        req.flash('รายงานไม่ถูกต้อง');
        return res.redirect('/admin/reports');
    }
    try {
        const changes = await reportModel.markHandled(reportId, req.user.user_id);
        req.flash(changes ? 'ทำเครื่องหมายว่าจัดการแล้ว' : 'รายงานนี้ถูกจัดการแล้วหรือไม่พบรายงาน');
        return res.redirect(`/admin/reports/${reportId}`);
    } catch (err) {
        console.error('mark report handled error:', err);
        req.flash('อัปเดตสถานะรายงานไม่สำเร็จ');
        return res.redirect(`/admin/reports/${reportId}`);
    }
};
