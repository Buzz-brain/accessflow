const express = require('express');
const env = require('../config/env');

const router = express.Router();

router.use(`${env.apiPrefix}/auth`, require('./auth.routes'));
router.use(`${env.apiPrefix}/accounts`, require('./account.routes'));
router.use(`${env.apiPrefix}/transactions`, require('./transaction.routes'));
router.use(`${env.apiPrefix}/accessibility`, require('./accessibility.routes'));
router.use(`${env.apiPrefix}/mam`, require('./mam.routes'));
router.use(`${env.apiPrefix}/mas`, require('./mas.routes'));
router.use(`${env.apiPrefix}/evaluation`, require('./evaluation.routes'));
router.use(`${env.apiPrefix}/admin`, require('./admin.routes'));

module.exports = router;
