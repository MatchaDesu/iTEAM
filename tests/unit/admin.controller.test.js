jest.mock('../../models/adminModel', () => ({
    getStats: jest.fn(), getUsersPage: jest.fn(), getUserById: jest.fn(), setMemberBanned: jest.fn()
}));
jest.mock('../../models/teamModel', () => ({ getAllPage: jest.fn(), getById: jest.fn() }));
jest.mock('../../models/teamMemberModel', () => ({ getTeamsByUserId: jest.fn(), getMembersByTeamId: jest.fn() }));

const adminModel = require('../../models/adminModel');
const teamModel = require('../../models/teamModel');
const teamMemberModel = require('../../models/teamMemberModel');
const admin = require('../../controllers/admin.controller');
const { makeReq, makeRes } = require('../helpers/http');

beforeEach(() => {
    jest.clearAllMocks();
    adminModel.getStats.mockResolvedValue({ total_users: 1 });
    adminModel.getUsersPage.mockResolvedValue({ users: [], total: 0 });
    adminModel.getUserById.mockResolvedValue({ user_id: 9 });
    adminModel.setMemberBanned.mockResolvedValue(true);
    teamModel.getAllPage.mockResolvedValue({ teams: [], total: 0 });
    teamModel.getById.mockResolvedValue({ team_id: 9 });
    teamMemberModel.getTeamsByUserId.mockResolvedValue([]);
    teamMemberModel.getMembersByTeamId.mockResolvedValue([]);
});

describe('admin pages', () => {
    test('dashboard renders stats', async () => {
        const res = makeRes();
        await admin.dashboard(makeReq(), res);
        expect(res.render).toHaveBeenCalledWith('admin/dashboard', { stats: { total_users: 1 } });
    });

    test('users validates role and loads a trimmed, paginated search', async () => {
        let req = makeReq({ query: { role: 'owner' } });
        await admin.getUsers(req, makeRes());
        expect(req.flash).toHaveBeenCalled();
        expect(adminModel.getUsersPage).not.toHaveBeenCalled();

        const res = makeRes();
        await admin.getUsers(makeReq({ query: { role: 'member', q: ' Alice ', page: '2' } }), res);
        expect(adminModel.getUsersPage).toHaveBeenCalledWith({ role: 'member', q: 'Alice', limit: 10, offset: 10 });
        expect(res.render).toHaveBeenCalledWith('admin/users', expect.objectContaining({
            users: [], role: 'member', q: 'Alice', currentUserId: 7,
            pagination: expect.objectContaining({ page: 1, totalPages: 1, total: 0 })
        }));
    });

    test('teams loads paginated search', async () => {
        const res = makeRes();
        await admin.getTeams(makeReq({ query: { q: ' design ' } }), res);
        expect(teamModel.getAllPage).toHaveBeenCalledWith({ q: 'design', limit: 10, offset: 0 });
        expect(res.render).toHaveBeenCalledWith('admin/teams', expect.objectContaining({
            teams: [], q: 'design', pagination: expect.objectContaining({ page: 1, totalPages: 1, total: 0 })
        }));
    });

    test.each([
        ['getUsers', adminModel.getUsersPage], ['getTeams', teamModel.getAllPage], ['dashboard', adminModel.getStats]
    ])('%s handles model errors', async (handler, modelMethod) => {
        modelMethod.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await admin[handler](makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });

    test('renders user details and returns 404 for missing users', async () => {
        const res = makeRes();
        await admin.getUserDetails(makeReq({ params: { userId: '9' } }), res);
        expect(res.render).toHaveBeenCalledWith('users/detail_profile', {
            profileUser: { user_id: 9 }, teams: [], adminReadOnly: true
        });
        adminModel.getUserById.mockResolvedValueOnce(null);
        const missing = makeRes();
        await admin.getUserDetails(makeReq({ params: { userId: '9' } }), missing);
        expect(missing.status).toHaveBeenCalledWith(404);
    });

    test('renders team details read-only', async () => {
        const res = makeRes();
        await admin.getTeamDetails(makeReq({ params: { teamId: '9' } }), res);
        expect(res.render).toHaveBeenCalledWith('teams/detail', expect.objectContaining({
            team: { team_id: 9 }, members: [], adminReadOnly: true, isFavorite: false
        }));
    });
});

describe('admin ban actions', () => {
    test('blocks invalid IDs and self-ban', async () => {
        let req = makeReq({ params: { userId: 'x' } });
        await admin.banUser(req, makeRes());
        expect(adminModel.setMemberBanned).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ข้อมูลการเปลี่ยนสถานะผู้ใช้ไม่ถูกต้อง');

        req = makeReq({ params: { userId: '7' } });
        await admin.banUser(req, makeRes());
        expect(adminModel.setMemberBanned).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ไม่สามารถแบนบัญชีของตัวเองได้');
    });

    test.each([['banUser', true], ['unbanUser', false]])('%s changes member ban state', async (handler, banned) => {
        const req = makeReq({ params: { userId: '9' }, body: { page: '2', q: 'x' } });
        const res = makeRes();
        await admin[handler](req, res);
        expect(adminModel.setMemberBanned).toHaveBeenCalledWith(9, banned);
        expect(res.redirect).toHaveBeenCalledWith('/admin/users?q=x&page=2');
    });
});
