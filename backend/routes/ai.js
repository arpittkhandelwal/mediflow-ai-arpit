const express = require('express');
const router = express.Router();
const { checkSymptoms, generateSummary, chat } = require('../controllers/aiController');
const { authenticate, optionalAuth } = require('../middlewares/auth');
const { symptomValidator, chatValidator, validateRequest } = require('../middlewares/validation');

router.post('/symptoms', optionalAuth, symptomValidator, validateRequest, checkSymptoms);
router.post('/summary',  authenticate, generateSummary);
router.post('/chat',     optionalAuth, chatValidator, validateRequest, chat);

module.exports = router;
