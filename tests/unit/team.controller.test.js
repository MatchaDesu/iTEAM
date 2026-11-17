jest.mock('../../models/teamModel', () => ({
    getAll: jest.fn(), getById: jest.fn(), createTeamWithLeader: jest.fn(),
    updateTeam: jest.fn(), deleteTeam: jest.fn()
}));
jest.mock('../../models/teamMemberModel', () => ({
    getTeamsByUserId: jest.fn(), getMembersByTeamId: jest.fn(), checkMember: jest.fn(), removeMember: jest.fn()
}));
jest.mock('../../models/applicationModel', () => ({
    checkPendingApplication: jest.fn(), createApplication: jest.fn(), getByTeamId: jest.fn(),
    getLatestByUserAndTeam: jest.fn()
}));
jest.mock('../../models/categoryModel', () => ({ getAll: jest.fn(), getById: jest.fn() }));
jest.mock('../../models/userModel', () => ({ getAll: jest.fn() }));
jest.mock('../../models/favoriteModel', () => ({ getTeamIdsByUserId: jest.fn(), isFavorite: jest.fn() }));
jest.mock('../../utils/teamAccess', () => ({ isTeamLeader: jest.fn() }));

const teamModel = require('../../models/teamModel');
const memberModel = require('../../models/teamMemberModel');
const applicationModel = require('../../models/applicationModel');
const categoryModel = require('../../models/categoryModel');
const userModel = require('../../models/userModel');
const favoriteModel = require('../../models/favoriteModel');
const { isTeamLeader } = require('../../utils/teamAccess');
const team = require('../../controllers/team.controller');
const { makeReq, makeRes } = require('../helpers/http');

const validCreateBody = overrides => ({
    team_name: 'Team One', description: 'Project description', category_id: '',
    max_members: '5', roles: 'Frontend, Backend, Frontend', initial_members: '[]',
    ...overrides
});

beforeEach(() => {
    jest.clearAllMocks();
    teamModel.getAll.mockResolvedValue([]);
    teamModel.getById.mockResolvedValue({ team_id: 5, team_name: 'Team One', status: 'open', max_members: 5, member_count: 2 });
    categoryModel.getAll.mockResolvedValue([]);
    categoryModel.getById.mockResolvedValue({ category_id: 2 });
    favoriteModel.getTeamIdsByUserId.mockResolvedValue([]);
    favoriteModel.isFavorite.mockResolvedValue(false);
    memberModel.getTeamsByUserId.mockResolvedValue([]);
    memberModel.getMembersByTeamId.mockResolvedValue([]);
    memberModel.checkMember.mockResolvedValue(null);
    applicationModel.checkPendingApplication.mockResolvedValue(null);
    applicationModel.getLatestByUserAndTeam.mockResolvedValue(null);
    applicationModel.getByTeamId.mockResolvedValue([]);
    teamModel.createTeamWithLeader.mockResolvedValue({ team_id: 5 });
    isTeamLeader.mockResolvedValue(true);
});

describe('team.getAll', () => {
    test('renders teams with category filter, search and favorites for signed-in user', async () => {
        teamModel.getAll.mockResolvedValue([
            { team_id: 1, team_name: 'Web Team', description: 'Frontend', category_id: 2, category_name: 'Tech', roles: ['UI'] },
            { team_id: 2, team_name: 'Design', description: 'Brand', category_id: 3, category_name: 'Art', roles: [] }
        ]);
        categoryModel.getAll.mockResolvedValue([{ category_id: 2, category_name: 'Tech' }]);
        favoriteModel.getTeamIdsByUserId.mockResolvedValue([1]);
        const req = makeReq({ query: { q: ' ui ', cat: '2' } });
        const res = makeRes();
        await team.getAll(req, res);
        expect(res.render).toHaveBeenCalledWith('teams/explore', expect.objectContaining({
            teams: [expect.objectContaining({ team_id: 1 })], categories: [{ category_id: 2, category_name: 'Tech' }],
            favoriteTeamIds: [1], q: ' ui ', cat: '2'
        }));
    });
    test('renders for guest without querying favorite model', async () => {
        const res = makeRes();
        await team.getAll(makeReq({ user: null }), res);
        expect(favoriteModel.getTeamIdsByUserId).not.toHaveBeenCalled();
        expect(res.render).toHaveBeenCalledWith('teams/explore', expect.objectContaining({ favoriteTeamIds: [] }));
    });
    test('handles model errors', async () => {
        teamModel.getAll.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await team.getAll(makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('team.getById', () => {
    test('rejects invalid and missing IDs', async () => {
        const invalidRes = makeRes();
        await team.getById(makeReq({ params: { teamId: '1.2' } }), invalidRes);
        expect(invalidRes.status).toHaveBeenCalledWith(400);
        teamModel.getById.mockResolvedValue(null);
        const missingRes = makeRes();
        await team.getById(makeReq({ params: { teamId: '5' } }), missingRes);
        expect(missingRes.status).toHaveBeenCalledWith(404);
    });
    test('renders guest view without user-specific queries', async () => {
        const res = makeRes();
        await team.getById(makeReq({ params: { teamId: '5' }, user: null }), res);
        expect(res.render).toHaveBeenCalledWith('teams/detail', expect.objectContaining({
            team: expect.any(Object), members: [], myApplication: null, isFavorite: false
        }));
        expect(favoriteModel.isFavorite).not.toHaveBeenCalled();
    });
    test('loads current user application and favorite state', async () => {
        const application = { status: 'pending' };
        applicationModel.getLatestByUserAndTeam.mockResolvedValue(application);
        favoriteModel.isFavorite.mockResolvedValue(true);
        const res = makeRes();
        await team.getById(makeReq({ params: { teamId: '5' } }), res);
        expect(applicationModel.getLatestByUserAndTeam).toHaveBeenCalledWith(7, 5);
        expect(favoriteModel.isFavorite).toHaveBeenCalledWith(7, 5);
        expect(res.render).toHaveBeenCalledWith('teams/detail', expect.objectContaining({ myApplication: application, isFavorite: true }));
    });
    test('renders server error on database failure', async () => {
        teamModel.getById.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await team.getById(makeReq({ params: { teamId: '5' } }), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('team.newApplicationPage', () => {
    test('renders application form for an eligible member', async () => {
        const res = makeRes();
        await team.newApplicationPage(makeReq({ params: { teamId: '5' } }), res);
        expect(res.render).toHaveBeenCalledWith('teams/applyteam', expect.objectContaining({
            team: expect.objectContaining({ team_id: 5 })
        }));
    });
    test.each([
        [{ status: 'closed', max_members: 5, member_count: 2 }, 'ทีมนี้ปิดรับสมัครแล้ว'],
        [{ status: 'open', max_members: 2, member_count: 2 }, 'ทีมนี้มีสมาชิกครบแล้ว']
    ])('redirects when team is closed or full', async (teamData, message) => {
        teamModel.getById.mockResolvedValue({ team_id: 5, ...teamData });
        const req = makeReq({ params: { teamId: '5' } });
        const res = makeRes();
        await team.newApplicationPage(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith('/teams/5');
    });
});

describe('team.apply', () => {
    test.each([
        [{ params: { teamId: '0' } }, 'ทีมไม่ถูกต้อง', '/teams'],
        [{ params: { teamId: '5' }, user: null }, 'กรุณาเข้าสู่ระบบก่อน', '/teams/5/apply']
    ])('validates ID and authentication', async (overrides, message, path) => {
        const req = makeReq(overrides);
        const res = makeRes();
        await team.apply(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith(path);
    });
    test('rejects nonexistent team, current member and duplicate pending application', async () => {
        teamModel.getById.mockResolvedValue(null);
        let req = makeReq({ params: { teamId: '5' } });
        let res = makeRes();
        await team.apply(req, res);
        expect(req.flash).toHaveBeenCalledWith('ไม่พบทีม');

        teamModel.getById.mockResolvedValue({ team_id: 5, status: 'open', max_members: 5, member_count: 2 });
        memberModel.checkMember.mockResolvedValue({ user_id: 7 });
        req = makeReq({ params: { teamId: '5' } }); res = makeRes();
        await team.apply(req, res);
        expect(req.flash).toHaveBeenCalledWith('คุณเป็นสมาชิกของทีมนี้อยู่แล้ว');

        memberModel.checkMember.mockResolvedValue(null);
        applicationModel.checkPendingApplication.mockResolvedValue({ application_id: 2 });
        req = makeReq({ params: { teamId: '5' } }); res = makeRes();
        await team.apply(req, res);
        expect(req.flash).toHaveBeenCalledWith('คุณมีคำขอที่รออนุมัติในทีมนี้อยู่แล้ว');
        expect(applicationModel.createApplication).not.toHaveBeenCalled();
    });
    test('creates application with trimmed message', async () => {
        const req = makeReq({ params: { teamId: '5' }, body: { message: '  Hello  ' } });
        const res = makeRes();
        await team.apply(req, res);
        expect(applicationModel.createApplication).toHaveBeenCalledWith({ user_id: 7, team_id: 5, message: 'Hello' });
        expect(res.redirect).toHaveBeenCalledWith('/teams/5');
    });
    test('uses null for empty message', async () => {
        await team.apply(makeReq({ params: { teamId: '5' }, body: { message: '  ' } }), makeRes());
        expect(applicationModel.createApplication).toHaveBeenCalledWith(expect.objectContaining({ message: null }));
    });
    test.each([
        [{ code: '23505' }, 'คุณมีคำขอที่รออนุมัติในทีมนี้อยู่แล้ว'],
        [{ code: '23503' }, 'ไม่พบผู้ใช้'],
        [new Error('db'), 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์']
    ])('handles database rejection', async (error, message) => {
        applicationModel.createApplication.mockRejectedValue(error);
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { teamId: '5' } });
        const res = makeRes();
        await team.apply(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith('/teams/5/apply');
    });
});

describe('team.create', () => {
    const run = async body => {
        const req = makeReq({ body });
        const res = makeRes();
        await team.create(req, res);
        return { req, res };
    };
    test.each([
        [{ ...validCreateBody(), team_name: '' }, 'กรุณากรอกชื่อทีมและรายละเอียด'],
        [{ ...validCreateBody(), description: null }, 'กรุณากรอกชื่อทีมและรายละเอียด'],
        [{ ...validCreateBody(), team_name: 'x'.repeat(101) }, 'ชื่อทีมต้องไม่เกิน 100 ตัวอักษร'],
        [{ ...validCreateBody(), max_members: '1' }, 'จำนวนสมาชิกต้องอยู่ระหว่าง 2 ถึง 50 คน'],
        [{ ...validCreateBody(), max_members: '51' }, 'จำนวนสมาชิกต้องอยู่ระหว่าง 2 ถึง 50 คน'],
        [{ ...validCreateBody(), max_members: '2.5' }, 'จำนวนสมาชิกต้องอยู่ระหว่าง 2 ถึง 50 คน'],
        [{ ...validCreateBody(), initial_members: '{bad' }, 'รายชื่อสมาชิกเริ่มต้นไม่ถูกต้อง'],
        [{ ...validCreateBody(), initial_members: '{}' }, 'รายชื่อสมาชิกเริ่มต้นไม่ถูกต้อง'],
        [{ ...validCreateBody(), initial_members: '[{"type":"external"}]' }, 'รายชื่อสมาชิกเริ่มต้นไม่ถูกต้อง'],
        [{ ...validCreateBody(), initial_members: '[{"type":"registered","user_id":"bad"}]' }, 'รายชื่อสมาชิกเริ่มต้นซ้ำหรือไม่ถูกต้อง'],
        [{ ...validCreateBody(), initial_members: '[{"type":"registered","user_id":7}]' }, 'รายชื่อสมาชิกเริ่มต้นซ้ำหรือไม่ถูกต้อง'],
        [{ ...validCreateBody(), initial_members: '[{"type":"registered","user_id":8},{"type":"registered","user_id":8}]' }, 'รายชื่อสมาชิกเริ่มต้นซ้ำหรือไม่ถูกต้อง'],
        [{ ...validCreateBody(), max_members: '2', initial_members: '[{"type":"registered","user_id":8},{"type":"registered","user_id":9}]' }, 'จำนวนสมาชิกเริ่มต้นเกินจำนวนสูงสุดของทีม']
    ])('rejects invalid/boundary input %#', async (body, message) => {
        const { req, res } = await run(body);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams/new');
        expect(teamModel.createTeamWithLeader).not.toHaveBeenCalled();
    });
    test.each(['2', '50'])('accepts max_members boundary %s', async max_members => {
        const { req, res } = await run(validCreateBody({ max_members }));
        expect(teamModel.createTeamWithLeader).toHaveBeenCalledWith(expect.objectContaining({ max_members: Number(max_members) }));
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams?team=5');
        expect(req.flash).toHaveBeenCalledWith('สร้างทีมสำเร็จ');
    });
    test('validates category and normalizes initial member data', async () => {
        const body = validCreateBody({ category_id: '2', roles: 'Frontend, , Backend,Frontend',
            initial_members: '[{"type":"registered","user_id":"8"}]' });
        const { res } = await run(body);
        expect(teamModel.createTeamWithLeader).toHaveBeenCalledWith(expect.objectContaining({
            category_id: 2, roles: ['Frontend', 'Backend'], initial_members: [8], created_by: 7
        }));
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams?team=5');
    });
    test('rejects unknown category', async () => {
        categoryModel.getById.mockResolvedValue(null);
        const { req, res } = await run(validCreateBody({ category_id: '99' }));
        expect(req.flash).toHaveBeenCalledWith('ไม่พบหมวดหมู่ที่ระบุ');
        expect(teamModel.createTeamWithLeader).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams/new');
    });
    test.each([
        [{ code: 'INVALID_INITIAL_MEMBERS' }, 'เลือกได้เฉพาะสมาชิกในระบบที่ยังใช้งานอยู่'],
        [{ code: '23505' }, 'ชื่อทีมนี้ถูกใช้แล้ว'],
        [new Error('db'), 'สร้างทีมไม่สำเร็จ']
    ])('handles creation failure', async (error, message) => {
        teamModel.createTeamWithLeader.mockRejectedValue(error);
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const { req } = await run(validCreateBody());
        expect(req.flash).toHaveBeenCalledWith(message);
    });
});

describe('leader team pages/actions', () => {
    test('renders list when no valid selected team query', async () => {
        const res = makeRes();
        await team.getMyTeams(makeReq(), res);
        expect(res.render).toHaveBeenCalledWith('leader/my-teams', { teams: [] });
    });
    test('redirects if selected team is missing or not led by current user', async () => {
        teamModel.getById.mockResolvedValue(null);
        const req = makeReq({ query: { team: '5' } });
        const res = makeRes();
        await team.getMyTeams(req, res);
        expect(req.flash).toHaveBeenCalledWith('ไม่พบทีมหรือคุณไม่มีสิทธิ์จัดการ');
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams');
    });
    test('renders selected team, applications, members and tab', async () => {
        const req = makeReq({ query: { team: '5', tab: 'appl' } });
        const res = makeRes();
        await team.getMyTeams(req, res);
        expect(res.render).toHaveBeenCalledWith('leader/my-teams', expect.objectContaining({
            selectedTeam: expect.any(Object), applications: [], members: [], tab: 'appl'
        }));
    });
    test('returns server error if listing fails', async () => {
        memberModel.getTeamsByUserId.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await team.getMyTeams(makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
    test('new-team page supplies categories and searchable users', async () => {
        categoryModel.getAll.mockResolvedValue([{ category_id: 1 }]);
        userModel.getAll.mockResolvedValue([{ user_id: 8 }]);
        const res = makeRes();
        await team.newTeamPage(makeReq(), res);
        expect(res.render).toHaveBeenCalledWith('leader/create-team', {
            categories: [{ category_id: 1 }], users: [{ user_id: 8 }]
        });
    });
    test('update enforces leader, validation, category and success paths', async () => {
        isTeamLeader.mockResolvedValue(false);
        let req = makeReq({ params: { teamId: '5' }, body: {} });
        let res = makeRes();
        await team.updateMyTeam(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams');

        isTeamLeader.mockResolvedValue(true);
        req = makeReq({ params: { teamId: '5' }, query: { tab: 'mem' }, body: { team_name: '', description: '' } });
        res = makeRes();
        await team.updateMyTeam(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams?team=5&tab=mem');

        req = makeReq({ params: { teamId: '5' }, body: { team_name: ' T ', description: ' D ', category_id: '', status: 'open' } });
        res = makeRes();
        await team.updateMyTeam(req, res);
        expect(teamModel.updateTeam).toHaveBeenCalledWith(5, { team_name: 'T', description: 'D', category_id: null, status: 'open' });
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams?team=5&tab=info');
    });
    test('rejects unknown category and handles update errors', async () => {
        categoryModel.getById.mockResolvedValue(null);
        let req = makeReq({ params: { teamId: '5' }, body: { team_name: 'T', description: 'D', category_id: '99', status: 'open' } });
        let res = makeRes();
        await team.updateMyTeam(req, res);
        expect(req.flash).toHaveBeenCalledWith('ไม่พบหมวดหมู่ที่ระบุ');

        teamModel.updateTeam.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        req = makeReq({ params: { teamId: '5' }, body: { team_name: 'T', description: 'D', status: 'open' } });
        res = makeRes();
        await team.updateMyTeam(req, res);
        expect(req.flash).toHaveBeenCalledWith('บันทึกข้อมูลทีมไม่สำเร็จ');
    });
    test('removes only existing non-leader members', async () => {
        memberModel.checkMember.mockResolvedValue({ team_role: 'leader' });
        let req = makeReq({ params: { teamId: '5', memberId: '8' } });
        let res = makeRes();
        await team.removeMember(req, res);
        expect(memberModel.removeMember).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ไม่สามารถนำสมาชิกคนนี้ออกได้');

        memberModel.checkMember.mockResolvedValue({ team_role: 'member' });
        req = makeReq({ params: { teamId: '5', memberId: '8' } }); res = makeRes();
        await team.removeMember(req, res);
        expect(memberModel.removeMember).toHaveBeenCalledWith(5, 8);
        expect(res.redirect).toHaveBeenCalledWith('/leader/teams?team=5&tab=mem');
    });
    test('denies non-leaders and handles removal DB errors', async () => {
        isTeamLeader.mockResolvedValue(false);
        let req = makeReq({ params: { teamId: '5', memberId: '8' } });
        let res = makeRes();
        await team.removeMember(req, res);
        expect(memberModel.checkMember).not.toHaveBeenCalled();

        isTeamLeader.mockResolvedValue(true);
        memberModel.checkMember.mockResolvedValue({ team_role: 'member' });
        memberModel.removeMember.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        req = makeReq({ params: { teamId: '5', memberId: '8' } }); res = makeRes();
        await team.removeMember(req, res);
        expect(req.flash).toHaveBeenCalledWith('นำสมาชิกออกจากทีมไม่สำเร็จ');
    });
});
