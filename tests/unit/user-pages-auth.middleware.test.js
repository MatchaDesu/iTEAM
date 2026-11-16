jest.mock('../../models/userModel', () => ({ getById: jest.fn(), updateUserInfo: jest.fn() }));
jest.mock('../../models/teamMemberModel', () => ({ getTeamsByUserId: jest.fn() }));
jest.mock('../../models/applicationModel', () => ({ getByUserId: jest.fn() }));

const userModel = require('../../models/userModel');
const teamMemberModel = require('../../models/teamMemberModel');
const applicationModel = require('../../models/applicationModel');
const user = require('../../controllers/user.controller');
const pages = require('../../controllers/pages.controller');
const { authenticate, requireRole } = require('../../middleware/auth');
const { makeReq, makeRes } = require('../helpers/http');

beforeEach(() => {
    jest.clearAllMocks();
    userModel.getById.mockResolvedValue({ user_id: 7 });
    teamMemberModel.getTeamsByUserId.mockResolvedValue([]);
    applicationModel.getByUserId.mockResolvedValue([]);
});

describe('public user profile', () => {
    test.each(['bad', '0', '-2', '1.5'])('rejects invalid ID %s', async userId => {
        const res = makeRes();
        await user.getProfile(makeReq({ params: { userId } }), res);
        expect(res.status).toHaveBeenCalledWith(400);
        expect(userModel.getById).not.toHaveBeenCalled();
    });
    test('returns not found for missing user', async () => {
        userModel.getById.mockResolvedValue(null);
        const res = makeRes();
        await user.getProfile(makeReq({ params: { userId: '8' } }), res);
        expect(res.status).toHaveBeenCalledWith(404);
    });
    test('renders profile and memberships', async () => {
        const person = { user_id: 8 };
        userModel.getById.mockResolvedValue(person);
        teamMemberModel.getTeamsByUserId.mockResolvedValue([{ team_id: 2 }]);
        const res = makeRes();
        await user.getProfile(makeReq({ params: { userId: '8' } }), res);
        expect(res.render).toHaveBeenCalledWith('users/detail_profile', {
            profileUser: person, teams: [{ team_id: 2 }]
        });
    });
    test('handles model errors', async () => {
        userModel.getById.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await user.getProfile(makeReq({ params: { userId: '8' } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('signed-in profile', () => {
    test('loads own profile data in parallel and renders', async () => {
        const res = makeRes();
        await user.getMyProfile(makeReq(), res);
        expect(userModel.getById).toHaveBeenCalledWith(7);
        expect(teamMemberModel.getTeamsByUserId).toHaveBeenCalledWith(7);
        expect(applicationModel.getByUserId).toHaveBeenCalledWith(7);
        expect(res.render).toHaveBeenCalledWith('users/profile', expect.objectContaining({
            profileUser: { user_id: 7 }, teams: [], applications: []
        }));
    });
    test('edit page loads user', async () => {
        const res = makeRes();
        await user.editMyProfile(makeReq(), res);
        expect(res.render).toHaveBeenCalledWith('users/edit', { user: { user_id: 7 } });
    });
    test.each(['getMyProfile', 'editMyProfile'])('%s handles database errors', async handler => {
        userModel.getById.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await user[handler](makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
    test('rejects missing required profile fields', async () => {
        const req = makeReq({ body: { username: '', first_name: 'A' } });
        const res = makeRes();
        await user.updateMyProfile(req, res);
        expect(userModel.updateUserInfo).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('กรุณากรอกข้อมูลที่จำเป็นให้ครบ');
        expect(res.redirect).toHaveBeenCalledWith('/profile/edit');
    });
    test('trims fields, converts skills, saves and redirects', async () => {
        const req = makeReq({ body: {
            username: ' alice ', first_name: ' Alice ', last_name: ' Doe ', email: ' a@example.test ',
            phone: ' 123 ', github: ' https://github.com/a ', skills: 'JS, Node, ,', bio: ' Hello '
        } });
        const res = makeRes();
        await user.updateMyProfile(req, res);
        expect(userModel.updateUserInfo).toHaveBeenCalledWith(7, expect.objectContaining({
            username: 'alice', email: 'a@example.test', skills: ['JS', 'Node'], bio: 'Hello'
        }));
        expect(req.flash).toHaveBeenCalledWith('บันทึกโปรไฟล์แล้ว');
        expect(res.redirect).toHaveBeenCalledWith('/profile');
    });
    test('redirects back to edit on update error', async () => {
        userModel.updateUserInfo.mockRejectedValue(new Error('unique'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ body: {
            username: 'alice', first_name: 'A', last_name: 'B', email: 'a@b.test', phone: '123'
        } });
        const res = makeRes();
        await user.updateMyProfile(req, res);
        expect(req.flash).toHaveBeenCalledWith('บันทึกโปรไฟล์ไม่สำเร็จ กรุณาตรวจสอบชื่อผู้ใช้หรืออีเมล');
        expect(res.redirect).toHaveBeenCalledWith('/profile/edit');
    });
});

describe('static pages', () => {
    test.each([
        ['home', 'pages/home', { active: 'home' }],
        ['about', 'pages/about', { active: 'about' }],
        ['guide', 'pages/guide', { active: 'guide' }]
    ])('%s renders', (handler, view, locals) => {
        const res = makeRes();
        pages[handler](makeReq(), res);
        expect(res.render).toHaveBeenCalledWith(view, locals);
    });
});

describe('authentication and role middleware', () => {
    test('allows authenticated user', () => {
        const next = jest.fn();
        authenticate(makeReq(), makeRes(), next);
        expect(next).toHaveBeenCalled();
    });
    test('redirects guest to login', () => {
        const req = makeReq({ user: null });
        const res = makeRes();
        authenticate(req, res, jest.fn());
        expect(req.flash).toHaveBeenCalledWith('กรุณาเข้าสู่ระบบก่อน');
        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });
    test('allows matching role and rejects other roles', () => {
        const next = jest.fn();
        requireRole('admin')(makeReq({ user: { role: 'admin' } }), makeRes(), next);
        expect(next).toHaveBeenCalled();
        const req = makeReq({ user: { role: 'member' } });
        const res = makeRes();
        requireRole('admin')(req, res, jest.fn());
        expect(req.flash).toHaveBeenCalledWith('ไม่มีสิทธิ์เข้าถึงหน้านี้');
        expect(res.redirect).toHaveBeenCalledWith('/');
    });
});
