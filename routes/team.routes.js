const express = require('express');
const router = express.Router();

// Explore Teams
router.get('/', (req, res) => {
    res.send('Teams');
});

// Team Detail
router.get('/:teamId', (req, res) => {
    res.send(`Teams ${req.params.teamId}`);
});

// Team Application Apply
router.post('/:teamId/apply', (req, res) => {
    res.send('created');
});

module.exports = router;