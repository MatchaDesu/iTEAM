jest.mock('../../models/categoryModel', () => ({
    createCategory: jest.fn(), updateCategory: jest.fn(), deleteCategory: jest.fn()
}));

const model = require('../../models/categoryModel');
const controller = require('../../controllers/category.controller');
const { makeReq, makeRes } = require('../helpers/http');

beforeEach(() => jest.clearAllMocks());

describe('category.create', () => {
    test.each([undefined, '', '  ', 'x'.repeat(101), ['bad']])('rejects invalid name %#', async name => {
        const req = makeReq({ body: { category_name: name } });
        const res = makeRes();
        await controller.create(req, res);
        expect(req.flash).toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/admin/categories');
        expect(model.createCategory).not.toHaveBeenCalled();
    });
    test('trims and creates valid name', async () => {
        const req = makeReq({ body: { category_name: '  Design  ' } });
        const res = makeRes();
        await controller.create(req, res);
        expect(model.createCategory).toHaveBeenCalledWith('Design');
        expect(req.flash).toHaveBeenCalledWith('เพิ่มหมวดหมู่แล้ว');
        expect(res.redirect).toHaveBeenCalledWith('/admin/categories');
    });
    test.each([[{ code: '23505' }, 'มีหมวดหมู่นี้แล้ว'], [new Error('db'), 'เพิ่มหมวดหมู่ไม่สำเร็จ']])
        ('handles create DB errors', async (error, message) => {
            model.createCategory.mockRejectedValue(error);
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const req = makeReq({ body: { category_name: 'Design' } });
            const res = makeRes();
            await controller.create(req, res);
            expect(req.flash).toHaveBeenCalledWith(message);
            expect(res.redirect).toHaveBeenCalledWith('/admin/categories');
        });
});

describe('category.update', () => {
    test.each([['x', 'Design'], ['2', ''], ['2', 'x'.repeat(101)]])('rejects invalid input %#', async (id, name) => {
        const req = makeReq({ params: { categoryId: id }, body: { category_name: name } });
        const res = makeRes();
        await controller.update(req, res);
        expect(model.updateCategory).not.toHaveBeenCalled();
        expect(res.redirect).toHaveBeenCalledWith('/admin/categories');
    });
    test.each([[1, 'แก้ไขหมวดหมู่แล้ว'], [0, 'ไม่พบหมวดหมู่']])('handles affected row count', async (changes, message) => {
        model.updateCategory.mockResolvedValue({ changes });
        const req = makeReq({ params: { categoryId: '3' }, body: { category_name: 'Design' } });
        const res = makeRes();
        await controller.update(req, res);
        expect(model.updateCategory).toHaveBeenCalledWith(3, 'Design');
        expect(req.flash).toHaveBeenCalledWith(message);
    });
    test.each([[{ code: '23505' }, 'มีหมวดหมู่นี้แล้ว'], [new Error('db'), 'แก้ไขหมวดหมู่ไม่สำเร็จ']])
        ('handles update DB errors', async (error, message) => {
            model.updateCategory.mockRejectedValue(error);
            jest.spyOn(console, 'error').mockImplementation(() => {});
            const req = makeReq({ params: { categoryId: '3' }, body: { category_name: 'Design' } });
            const res = makeRes();
            await controller.update(req, res);
            expect(req.flash).toHaveBeenCalledWith(message);
        });
});

describe('category.remove', () => {
    test('rejects invalid ID', async () => {
        const req = makeReq({ params: { categoryId: '0' } });
        const res = makeRes();
        await controller.remove(req, res);
        expect(model.deleteCategory).not.toHaveBeenCalled();
        expect(req.flash).toHaveBeenCalledWith('หมวดหมู่ไม่ถูกต้อง');
    });
    test.each([[1, 'ลบหมวดหมู่แล้ว'], [0, 'ไม่พบหมวดหมู่']])('handles delete row count', async (changes, message) => {
        model.deleteCategory.mockResolvedValue({ changes });
        const req = makeReq({ params: { categoryId: '3' } });
        const res = makeRes();
        await controller.remove(req, res);
        expect(req.flash).toHaveBeenCalledWith(message);
    });
    test('handles DB error', async () => {
        model.deleteCategory.mockRejectedValue(new Error('db'));
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const req = makeReq({ params: { categoryId: '3' } });
        const res = makeRes();
        await controller.remove(req, res);
        expect(req.flash).toHaveBeenCalledWith('ลบหมวดหมู่ไม่สำเร็จ');
    });
});
