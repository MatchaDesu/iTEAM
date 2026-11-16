jest.mock('../../models/adminModel', () => ({ getStats: jest.fn(), getUsers: jest.fn() }));
jest.mock('../../models/teamModel', () => ({ getAll: jest.fn(), deleteTeam: jest.fn(), updateCategory: jest.fn() }));
jest.mock('../../models/categoryModel', () => ({ getAll: jest.fn(), getById: jest.fn() }));

const adminModel = require('../../models/adminModel');
const teamModel = require('../../models/teamModel');
const categoryModel = require('../../models/categoryModel');
const admin = require('../../controllers/admin.controller');
const { makeReq, makeRes } = require('../helpers/http');

beforeEach(() => {
    jest.clearAllMocks();
    adminModel.getStats.mockResolvedValue({ total_users: 1 });
    adminModel.getUsers.mockResolvedValue([]);
    teamModel.getAll.mockResolvedValue([]);
    teamModel.deleteTeam.mockResolvedValue({ changes: 1 });
    teamModel.updateCategory.mockResolvedValue({ changes: 1 });
    categoryModel.getAll.mockResolvedValue([]);
    categoryModel.getById.mockResolvedValue({ category_id: 2 });
});

describe('admin read pages', () => {
    test('dashboard renders stats', async () => {
        const res = makeRes();
        await admin.dashboard(makeReq(), res);
        expect(res.render).toHaveBeenCalledWith('admin/dashboard', { stats: { total_users: 1 } });
    });
    test('dashboard handles DB error', async () => {
        adminModel.getStats.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await admin.dashboard(makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
    test('users rejects unknown role and treats empty role as all', async () => {
        const req = makeReq({ query: { role: 'owner' } });
        const res = makeRes();
        await admin.getUsers(req, res);
        expect(req.flash).toHaveBeenCalled();
        expect(adminModel.getUsers).not.toHaveBeenCalled();

        const allReq = makeReq({ query: { role: '' } });
        await admin.getUsers(allReq, makeRes());
        expect(adminModel.getUsers).toHaveBeenCalledWith(undefined);
    });
    test('users filters case-insensitively on names, username and email', async () => {
        adminModel.getUsers.mockResolvedValue([
            { username: 'alice', first_name: 'Alice', last_name: 'One', email: 'a@x.test' },
            { username: 'bob', first_name: 'Bob', last_name: 'Two', email: 'b@x.test' }
        ]);
        const res = makeRes();
        await admin.getUsers(makeReq({ query: { role: 'member', q: ' ALICE ' } }), res);
        expect(res.render).toHaveBeenCalledWith('admin/users', {
            users: [expect.objectContaining({ username: 'alice' })], role: 'member', q: 'alice'
        });
    });
    test('teams filter by text and category', async () => {
        teamModel.getAll.mockResolvedValue([
            { team_name: 'Code', description: 'Web', category_name: 'Tech' },
            { team_name: 'Art', description: 'Brand', category_name: 'Design' }
        ]);
        categoryModel.getAll.mockResolvedValue([{ category_name: 'Tech' }]);
        const res = makeRes();
        await admin.getTeams(makeReq({ query: { q: 'web', cat: 'Tech' } }), res);
        expect(res.render).toHaveBeenCalledWith('admin/teams', expect.objectContaining({
            teams: [expect.objectContaining({ team_name: 'Code' })], categories: [{ category_name: 'Tech' }]
        }));
    });
    test.each(['getUsers', 'getTeams'])('%s returns server error on model failure', async handler => {
        adminModel.getUsers.mockRejectedValue(new Error('db'));
        teamModel.getAll.mockRejectedValue(new Error('db'));
        categoryModel.getAll.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await admin[handler](makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('admin mutations', () => {
    test('deleteTeam validates ID, handles missing row and success', async () => {
        let req = makeReq({ params: { teamId: 'bad' } });
        let res = makeRes();
        await admin.deleteTeam(req, res);
        expect(teamModel.deleteTeam).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ทีมไม่ถูกต้อง');

        teamModel.deleteTeam.mockResolvedValueOnce({ changes: 0 });
        req = makeReq({ params: { teamId: '9' } }); res = makeRes();
        await admin.deleteTeam(req, res);
        expect(req.flash).toHaveBeenCalledWith('ไม่พบทีม');

        teamModel.deleteTeam.mockResolvedValueOnce({ changes: 1 });
        req = makeReq({ params: { teamId: '9' } }); res = makeRes();
        await admin.deleteTeam(req, res);
        expect(req.flash).toHaveBeenCalledWith('ลบทีมแล้ว');
    });
    test('deleteTeam handles DB errors', async () => {
        teamModel.deleteTeam.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { teamId: '9' } });
        await admin.deleteTeam(req, makeRes());
        expect(req.flash).toHaveBeenCalledWith('ลบทีมไม่สำเร็จ');
    });
    test('updates a team category, allows clearing it, and validates IDs', async () => {
        let req = makeReq({ params: { teamId: 'bad' }, body: { category_id: '2' } });
        await admin.updateTeamCategory(req, makeRes());
        expect(teamModel.updateCategory).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ทีม/หมวดหมู่ไม่ถูกต้อง');

        req = makeReq({ params: { teamId: '9' }, body: { category_id: '999' } });
        categoryModel.getById.mockResolvedValueOnce(null);
        await admin.updateTeamCategory(req, makeRes());
        expect(teamModel.updateCategory).not.toHaveBeenCalled();

        req = makeReq({ params: { teamId: '9' }, body: { category_id: '2' } });
        await admin.updateTeamCategory(req, makeRes());
        expect(teamModel.updateCategory).toHaveBeenCalledWith(9, 2);
        expect(req.flash).toHaveBeenCalledWith('อัปเดตหมวดหมู่ทีมแล้ว');

        req = makeReq({ params: { teamId: '9' }, body: { category_id: '' } });
        await admin.updateTeamCategory(req, makeRes());
        expect(teamModel.updateCategory).toHaveBeenCalledWith(9, null);
    });
});
