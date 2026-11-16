jest.mock('../../models/userModel', () => ({
    getByEmail: jest.fn(),
    createUser: jest.fn()
}));
jest.mock('../../utils/password', () => ({ comparePassword: jest.fn() }));

const userModel = require('../../models/userModel');
const password = require('../../utils/password');
const auth = require('../../controllers/auth.controller');
const { makeReq, makeRes } = require('../helpers/http');

const validSignup = () => ({
    username: 'alice', first_name: 'Alice', last_name: 'Doe', email: 'ALICE@example.com',
    phone: '0812345678', github: '', password: 'password123'
});

beforeEach(() => jest.clearAllMocks());

describe('auth page handlers', () => {
    test.each([
        ['showLogin', 'auth/signIn'],
        ['showSignup', 'auth/signUp']
    ])('%s renders guest page', (handler, view) => {
        const req = makeReq({ user: null });
        const res = makeRes();
        auth[handler](req, res);
        expect(res.render).toHaveBeenCalledWith(view, { layout: 'layouts/auth' });
    });

    test.each([
        ['showLogin', { role: 'member' }, '/'],
        ['showSignup', { role: 'member' }, '/'],
        ['showLogin', { role: 'admin' }, '/admin'],
        ['showSignup', { role: 'admin' }, '/admin']
    ])('%s redirects an existing user by role', (handler, user, destination) => {
        const res = makeRes();
        auth[handler](makeReq({ user }), res);
        expect(res.redirect).toHaveBeenCalledWith(destination);
    });
});

describe('register', () => {
    test.each([
        [{}, 'กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น'],
        [{ ...validSignup(), username: 'x'.repeat(31) }, 'username ต้องไม่เกิน 30 ตัวอักษร'],
        [{ ...validSignup(), phone: '1'.repeat(16) }, 'เบอร์โทรต้องไม่เกิน 15 ตัวอักษร'],
        [{ ...validSignup(), email: 'bad-email' }, 'รูปแบบอีเมลไม่ถูกต้อง'],
        [{ ...validSignup(), password: 'short' }, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'],
        [{ ...validSignup(), password: 'x'.repeat(73) }, 'รหัสผ่านต้องไม่เกิน 72 ตัวอักษร'],
        [{ ...validSignup(), username: ['alice'] }, 'กรุณากรอกข้อมูลให้ครบทุกช่องที่จำเป็น']
    ])('rejects invalid payload %#', async (body, message) => {
        const req = makeReq({ body });
        const res = makeRes();
        await auth.register(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith('/auth/signup');
        expect(userModel.createUser).not.toHaveBeenCalled();
    });

    test('rejects an existing email', async () => {
        userModel.getByEmail.mockResolvedValue({ user_id: 3 });
        const req = makeReq({ body: validSignup() });
        const res = makeRes();
        await auth.register(req, res);
        expect(userModel.getByEmail).toHaveBeenCalledWith('alice@example.com');
        expect(req.flash).toHaveBeenCalledWith('อีเมลนี้ถูกใช้งานแล้ว');
        expect(userModel.createUser).not.toHaveBeenCalled();
    });

    test('creates user with normalized fields and redirects to login', async () => {
        userModel.getByEmail.mockResolvedValue(undefined);
        userModel.createUser.mockResolvedValue({ user_id: 4 });
        const req = makeReq({ body: validSignup() });
        const res = makeRes();
        await auth.register(req, res);
        expect(userModel.createUser).toHaveBeenCalledWith(expect.objectContaining({
            username: 'alice', email: 'alice@example.com', github: null
        }));
        expect(req.flash).toHaveBeenCalledWith('สมัครสมาชิกสำเร็จ เข้าสู่ระบบได้เลย');
        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });

    test.each([
        [{ code: '23505' }, 'username, อีเมล หรือ GitHub นี้ถูกใช้งานแล้ว'],
        [new Error('db down'), 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่']
    ])('handles create failure', async (error, message) => {
        userModel.getByEmail.mockResolvedValue(undefined);
        userModel.createUser.mockRejectedValue(error);
        const req = makeReq({ body: validSignup() });
        const res = makeRes();
        await auth.register(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
        expect(res.redirect).toHaveBeenCalledWith('/auth/signup');
    });
});

describe('login', () => {
    test('validates required fields', async () => {
        const req = makeReq({ body: { email: '', password: '' } });
        const res = makeRes();
        await auth.login(req, res);
        expect(req.flash).toHaveBeenCalledWith('กรุณากรอกอีเมลและรหัสผ่าน');
        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });

    test.each([
        [null, false],
        [{ user_id: 3, password: 'hash', deleted_at: new Date() }, true],
        [{ user_id: 3, password: 'hash' }, false]
    ])('rejects invalid, deleted, or mismatched account', async (user, matches) => {
        userModel.getByEmail.mockResolvedValue(user);
        password.comparePassword.mockResolvedValue(matches);
        const req = makeReq({ body: { email: 'A@EXAMPLE.COM', password: 'input' } });
        const res = makeRes();
        await auth.login(req, res);
        expect(req.flash).toHaveBeenCalledWith('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });

    test('regenerates session and logs in active account', async () => {
        userModel.getByEmail.mockResolvedValue({ user_id: 9, first_name: 'A', password: 'hash' });
        password.comparePassword.mockResolvedValue(true);
        const req = makeReq({ body: { email: 'A@EXAMPLE.COM', password: 'input' } });
        const res = makeRes();
        await auth.login(req, res);
        expect(req.session.regenerate).toHaveBeenCalled();
        expect(req.session.user).toEqual({ user_id: 9 });
        expect(req.session.save).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/');
    });

    test('redirects admin account to admin dashboard', async () => {
        userModel.getByEmail.mockResolvedValue({ user_id: 9, role: 'admin', first_name: 'A', password: 'hash' });
        password.comparePassword.mockResolvedValue(true);
        const res = makeRes();
        await auth.login(makeReq({ body: { email: 'admin@example.com', password: 'input' } }), res);
        expect(res.redirect).toHaveBeenCalledWith('/admin');
    });

    test('handles session and database errors', async () => {
        userModel.getByEmail.mockRejectedValue(new Error('db down'));
        const req = makeReq({ body: { email: 'a@example.com', password: 'password' } });
        const res = makeRes();
        await auth.login(req, res);
        expect(req.flash).toHaveBeenCalledWith('เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่');
        expect(res.redirect).toHaveBeenCalledWith('/auth/login');
    });

    test('handles session regeneration failure', async () => {
        userModel.getByEmail.mockResolvedValue({ user_id: 9, password: 'hash' });
        password.comparePassword.mockResolvedValue(true);
        const req = makeReq({
            body: { email: 'a@example.com', password: 'password' },
            session: { regenerate: callback => callback(new Error('session')) }
        });
        const res = makeRes();
        await auth.login(req, res);
        expect(req.flash).toHaveBeenCalledWith('เกิดข้อผิดพลาดของเซิร์ฟเวอร์ กรุณาลองใหม่');
    });
});

describe('logout', () => {
    test('clears the session and redirects home', async () => {
        const req = makeReq();
        const res = makeRes();
        await auth.logout(req, res);
        expect(req.session.regenerate).toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('ออกจากระบบแล้ว');
        expect(res.redirect).toHaveBeenCalledWith('/');
    });

    test('still redirects if session cleanup fails', async () => {
        const req = makeReq({
            session: { regenerate: callback => callback(new Error('session')) }
        });
        const res = makeRes();
        await auth.logout(req, res);
        expect(res.redirect).toHaveBeenCalledWith('/');
    });
});
