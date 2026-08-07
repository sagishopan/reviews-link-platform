const express = require('express');

const router = express.Router();

router.use('/restaurants', require('./restaurants'));
router.use('/branches', require('./branches'));
router.use('/users', require('./users'));
router.use('/responses', require('./responses'));
router.use('/analytics', require('./analytics'));
router.use('/export', require('./export'));
router.use('/qrcodes', require('./qrcodes'));
router.use('/settings', require('./settings'));

module.exports = router;
