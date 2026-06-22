const express = require('express');
const router = express.Router();
const { getAISummary } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');
const { body } = require('express-validator');
const { handleValidation } = require('../middleware/validate');

router.post(
  '/ai-summary',
  protect,
  [body('employee').notEmpty().withMessage('Employee data is required')],
  handleValidation,
  getAISummary
);

module.exports = router;
