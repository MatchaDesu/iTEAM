jest.mock('../../models/favoriteModel', () => ({
    getByUserId: jest.fn(), getTeamIdsByUserId: jest.fn(), isFavorite: jest.fn(),
    add: jest.fn(), remove: jest.fn()
}));
jest.mock('../../models/teamModel', () => ({ getById: jest.fn() }));
jest.mock('../../models/notificationModel', () => ({
    getByUserId: jest.fn(), markRead: jest.fn()
}));

const favoriteModel = require('../../models/favoriteModel');
const teamModel = require('../../models/teamModel');
const notificationModel = require('../../models/notificationModel');
const favorite = require('../../controllers/favorite.controller');
const notification = require('../../controllers/notification.controller');
const { makeReq, makeRes } = require('../helpers/http');

beforeEach(() => jest.clearAllMocks());

describe('favorites page', () => {
    test('renders user favorites and IDs', async () => {
        const teams = [{ team_id: 3 }, { team_id: 8 }];
        favoriteModel.getByUserId.mockResolvedValue(teams);
        const res = makeRes();
        await favorite.index(makeReq(), res);
        expect(res.render).toHaveBeenCalledWith('teams/favorites', expect.objectContaining({
            teams, favoriteTeamIds: [3, 8], favoriteReturnTo: '/favorites'
        }));
    });
    test('renders error on model failure', async () => {
        favoriteModel.getByUserId.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await favorite.index(makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
});

describe('favorite save', () => {
    test('rejects invalid ID', async () => {
        const req = makeReq({ params: { teamId: '0' } });
        const res = makeRes();
        await favorite.save(req, res);
        expect(teamModel.getById).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ทีมไม่ถูกต้อง');
    });
    test('rejects missing team', async () => {
        teamModel.getById.mockResolvedValue(null);
        const req = makeReq({ params: { teamId: '4' }, body: { returnTo: '/favorites' } });
        const res = makeRes();
        await favorite.save(req, res);
        expect(favoriteModel.add).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/favorites');
    });
    test('saves valid team and accepts only internal return URLs', async () => {
        teamModel.getById.mockResolvedValue({ team_id: 4 });
        const req = makeReq({ params: { teamId: '4' }, body: { returnTo: '/teams/4' } });
        const res = makeRes();
        await favorite.save(req, res);
        expect(favoriteModel.add).toHaveBeenCalledWith(7, 4);
        expect(res.redirect).toHaveBeenCalledWith('/teams/4');
    });
    test('falls back to teams page for external redirect URLs', async () => {
        teamModel.getById.mockResolvedValue({ team_id: 4 });
        const req = makeReq({ params: { teamId: '4' }, body: { returnTo: '//evil.test' } });
        const res = makeRes();
        await favorite.save(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/teams');
    });
    test('handles database error', async () => {
        teamModel.getById.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { teamId: '4' } });
        const res = makeRes();
        await favorite.save(req, res);
        expect(req.flash).toHaveBeenCalledWith('บันทึกทีมโปรดไม่สำเร็จ');
    });
});

describe('favorite remove', () => {
    test('rejects invalid ID', async () => {
        const req = makeReq({ params: { teamId: 'abc' } });
        const res = makeRes();
        await favorite.remove(req, res);
        expect(favoriteModel.remove).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ทีมไม่ถูกต้อง');
    });
    test('removes only for current user', async () => {
        const req = makeReq({ params: { teamId: '4' }, body: { returnTo: '/favorites' } });
        const res = makeRes();
        await favorite.remove(req, res);
        expect(favoriteModel.remove).toHaveBeenCalledWith(7, 4);
        expect(res.redirect).toHaveBeenCalledWith('/favorites');
    });
});

describe('notifications', () => {
    test('renders current user notifications', async () => {
        const notifications = [{ notification_id: 2 }];
        notificationModel.getByUserId.mockResolvedValue(notifications);
        const res = makeRes();
        await notification.index(makeReq(), res);
        expect(notificationModel.getByUserId).toHaveBeenCalledWith(7);
        expect(res.render).toHaveBeenCalledWith('teams/notifications', { notifications, active: 'notes' });
    });
    test('returns server error when loading fails', async () => {
        notificationModel.getByUserId.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const res = makeRes();
        await notification.index(makeReq(), res);
        expect(res.status).toHaveBeenCalledWith(500);
    });
    test('rejects invalid read ID', async () => {
        const req = makeReq({ params: { notificationId: 'bad' } });
        const res = makeRes();
        await notification.markRead(req, res);
        expect(notificationModel.markRead).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('การแจ้งเตือนไม่ถูกต้อง');
    });
    test('marks only current user notification as read', async () => {
        notificationModel.markRead.mockResolvedValue(1);
        const req = makeReq({ params: { notificationId: '12' } });
        const res = makeRes();
        await notification.markRead(req, res);
        expect(notificationModel.markRead).toHaveBeenCalledWith(12, 7);
        expect(req.flash).toHaveBeenCalledWith('ทำเครื่องหมายว่าอ่านแล้ว');
        expect(res.redirect).toHaveBeenCalledWith('/notifications');
    });
    test('does not flash when notification was already read or belongs to another user', async () => {
        notificationModel.markRead.mockResolvedValue(0);
        const req = makeReq({ params: { notificationId: '12' } });
        const res = makeRes();
        await notification.markRead(req, res);
        expect(req.flash).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/notifications');
    });
    test('handles read update error', async () => {
        notificationModel.markRead.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { notificationId: '12' } });
        const res = makeRes();
        await notification.markRead(req, res);
        expect(req.flash).toHaveBeenCalledWith('อัปเดตการแจ้งเตือนไม่สำเร็จ');
    });
});
