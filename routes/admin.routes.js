const express = require('express');
const router = express.Router();

// Admin Dashboard
router.get('/', (req, res) => {
    res.send('Dashboard');
});

module.exports = router;