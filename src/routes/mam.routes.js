const express = require('express');
const mamController = require('../controllers/mam.controller');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(protect);

router.get('/dimensions', asyncHandler(mamController.dimensions));
router.get('/criteria', asyncHandler(mamController.criteria));
router.get('/weights', asyncHandler(mamController.weights));

module.exports = router;
