exports.makeReq = (overrides = {}) => ({
    params: {},
    query: {},
    body: {},
    user: { user_id: 7, role: 'member' },
    session: {
        regenerate: jest.fn(callback => callback(null)),
        save: jest.fn(callback => callback(null))
    },
    flash: jest.fn(),
    ...overrides
});

exports.makeRes = () => {
    const res = {};
    res.render = jest.fn(() => res);
    res.redirect = jest.fn(() => res);
    res.status = jest.fn(() => res);
    res.send = jest.fn(() => res);
    return res;
};
