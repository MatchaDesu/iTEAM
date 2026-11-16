const applicationModel = require('../models/applicationModel');
const { parseId } = require('../utils/currentUser');
const { isTeamLeader } = require('../utils/teamAccess');

exports.getMine = async (req, res) => {
    try {
        const applications = await applicationModel.getByUserId(req.user.user_id);
        return res.render('teams/applications', { applications });
    } catch (err) {
        console.error('getMine applications error:', err);
        return res.status(500).send('เกิดข้อผิดพลาดของเซิร์ฟเวอร์');
    }
};

exports.review = async (req, res) => {
    const appId = parseId(req.params.appId);
    const userId = req.user.user_id;
    const status = req.body?.status;
    const fallback = '/leader/teams';

    if (!appId || !['approved', 'rejected'].includes(status)) {
        req.flash('ข้อมูลใบสมัครไม่ถูกต้อง');
        return res.redirect(fallback);
    }

    try {
        const application = await applicationModel.getById(appId);
        if (!application) {
            req.flash('ไม่พบใบสมัคร');
            return res.redirect(fallback);
        }
        const returnToTeam = `/leader/teams?team=${application.team_id}&tab=appl`;
        if (!(await isTeamLeader(application.team_id, userId))) {
            req.flash('เฉพาะหัวหน้าทีมเท่านั้น');
            return res.redirect(fallback);
        }

        const { result } = await applicationModel.reviewApplication(appId, status, userId);
        if (result === 'not_found') req.flash('ไม่พบใบสมัคร');
        else if (result === 'already_reviewed') req.flash('ใบสมัครนี้ถูกพิจารณาแล้ว');
        else req.flash(status === 'approved' ? 'รับผู้สมัครเข้าทีมแล้ว' : 'ปฏิเสธใบสมัครแล้ว');
        return res.redirect(returnToTeam);
    } catch (err) {
        console.error('review application error:', err);
        req.flash('เกิดข้อผิดพลาดขณะพิจารณาใบสมัคร');
        return res.redirect(fallback);
    }
};

exports.cancelMine = async (req, res) => {
    const appId = parseId(req.params.appId);
    const userId = req.user.user_id;
    if (!appId) {
        req.flash('ใบสมัครไม่ถูกต้อง');
        return res.redirect('/application');
    }
    try {
        const application = await applicationModel.getById(appId);
        if (!application || Number(application.user_id) !== Number(userId)) {
            req.flash('ไม่พบใบสมัคร');
            return res.redirect('/application');
        }
        if (application.status !== 'pending') {
            req.flash('ยกเลิกได้เฉพาะใบสมัครที่รอพิจารณา');
            return res.redirect('/application');
        }
        await applicationModel.deleteApplication(appId);
        req.flash('ยกเลิกใบสมัครแล้ว');
        return res.redirect('/application');
    } catch (err) {
        console.error('cancel application error:', err);
        req.flash('ยกเลิกใบสมัครไม่สำเร็จ');
        return res.redirect('/application');
    }
};
