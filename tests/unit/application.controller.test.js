jest.mock('../../models/applicationModel', () => ({
    getByUserId: jest.fn(), getById: jest.fn(), reviewApplication: jest.fn(), deleteApplication: jest.fn()
}));
jest.mock('../../utils/teamAccess', () => ({ isTeamLeader: jest.fn() }));

const applicationModel = require('../../models/applicationModel');
const { isTeamLeader } = require('../../utils/teamAccess');
const application = require('../../controllers/application.controller');
const { makeReq, makeRes } = require('../helpers/http');

beforeEach(() => {
    jest.clearAllMocks();
    applicationModel.getByUserId.mockResolvedValue([]);
    applicationModel.getById.mockResolvedValue({ application_id: 3, team_id: 5, user_id: 7, status: 'pending' });
    applicationModel.reviewApplication.mockResolvedValue({ result: 'ok' });
    applicationModel.deleteApplication.mockResolvedValue({ changes: 1 });
    isTeamLeader.mockResolvedValue(true);
});

describe('application list', () => {
    test('renders signed-in user list', async () => {
        applicationModel.getByUserId.mockResolvedValue([{ application_id: 3 }]);
        const res = makeRes();
        await application.getMine(makeReq(), res);
        expect(applicationModel.getByUserId).toHaveBeenCalledWith(7);
        expect(res.render).toHaveBeenCalledWith('teams/applications', { applications: [{ application_id: 3 }] });
    });
    test('returns server error on DB failure', async () => {
        applicationModel.getByUserId.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await application.getMine(makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('application review', () => {
    test.each([
        [{ appId: 'bad' }, { status: 'approved' }],
        [{ appId: '3' }, { status: 'pending' }],
        [{ appId: '3' }, {}]
    ])('rejects bad ID or status', async (params, body) => {
        const req = makeReq({ params, body });
        const res = makeRes();
        await application.review(req, res);
        expect(applicationModel.getById).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ข้อมูลใบสมัครไม่ถูกต้อง');
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams');
    });
    test('rejects missing application and non-leader', async () => {
        applicationModel.getById.mockResolvedValueOnce(null);
        let req = makeReq({ params: { appId: '3' }, body: { status: 'approved' } });
        let res = makeRes();
        await application.review(req, res);
        expect(req.flash).toHaveBeenCalledWith('ไม่พบใบสมัคร');

        isTeamLeader.mockResolvedValue(false);
        req = makeReq({ params: { appId: '3' }, body: { status: 'approved' } });
        res = makeRes();
        await application.review(req, res);
        expect(applicationModel.reviewApplication).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('เฉพาะหัวหน้าทีมเท่านั้น');
    });
    test.each([
        ['approved', 'รับผู้สมัครเข้าทีมแล้ว'],
        ['rejected', 'ปฏิเสธใบสมัครแล้ว']
    ])('reviews status %s and returns to team applicant tab', async (status, message) => {
        const req = makeReq({ params: { appId: '3' }, body: { status } });
        const res = makeRes();
        await application.review(req, res);
        expect(applicationModel.reviewApplication).toHaveBeenCalledWith(3, status, 7);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams?team=5&tab=appl');
    });
    test.each([
        ['not_found', 'ไม่พบใบสมัคร'],
        ['already_reviewed', 'ใบสมัครนี้ถูกพิจารณาแล้ว']
    ])('handles concurrent review result %s', async (result, message) => {
        applicationModel.reviewApplication.mockResolvedValue({ result });
        const req = makeReq({ params: { appId: '3' }, body: { status: 'approved' } });
        const res = makeRes();
        await application.review(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
    });
    test('redirects on review database failure', async () => {
        applicationModel.reviewApplication.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { appId: '3' }, body: { status: 'approved' } });
        const res = makeRes();
        await application.review(req, res);
        expect(req.flash).toHaveBeenCalledWith('เกิดข้อผิดพลาดขณะพิจารณาใบสมัคร');
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams');
    });
});

describe('cancel application', () => {
    test('rejects invalid ID', async () => {
        const req = makeReq({ params: { appId: 'x' } });
        const res = makeRes();
        await application.cancelMine(req, res);
        expect(applicationModel.getById).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ใบสมัครไม่ถูกต้อง');
    });
    test.each([
        [null, 'ไม่พบใบสมัคร'],
        [{ user_id: 9, status: 'pending' }, 'ไม่พบใบสมัคร'],
        [{ user_id: 7, status: 'approved' }, 'ยกเลิกได้เฉพาะใบสมัครที่รอพิจารณา']
    ])('enforces ownership and pending state', async (record, message) => {
        applicationModel.getById.mockResolvedValue(record);
        const req = makeReq({ params: { appId: '3' } });
        const res = makeRes();
        await application.cancelMine(req, res);
        expect(applicationModel.deleteApplication).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith(message);
    });
    test('cancels an owned pending application', async () => {
        const req = makeReq({ params: { appId: '3' } });
        const res = makeRes();
        await application.cancelMine(req, res);
        expect(applicationModel.deleteApplication).toHaveBeenCalledWith(3);
        expect(req.flash).toHaveBeenCalledWith('ยกเลิกใบสมัครแล้ว');
        expect(res.redirect).toHaveBeenCalledWith('/application');
    });
    test('handles DB failure', async () => {
        applicationModel.getById.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { appId: '3' } });
        await application.cancelMine(req, makeRes());
        expect(req.flash).toHaveBeenCalledWith('ยกเลิกใบสมัครไม่สำเร็จ');
    });
});
