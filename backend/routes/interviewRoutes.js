const express = require('express');
const protect = require('../middleware/authMiddleware');
const { getTopics, ask, getHistory } = require('../controllers/interviewController');

const router = express.Router();

router.get('/topics', protect, getTopics);
router.post('/ask', protect, ask);
router.get('/history', protect, getHistory);

module.exports = router;