const express = require('express');
const router = express.Router();

// User Profile
router.get('/:userId', (req, res) => {
    res.send(`User ${req.params.userId}`);
})

module.exports = router;