const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');
const { employeeValidation, employeeUpdateValidation, handleValidation } = require('../middleware/validate');

// All employee routes require authentication
router.use(protect);

router.route('/')
  .get(authorize('admin'), getEmployees)
  .post(authorize('admin'), employeeValidation, handleValidation, createEmployee);

router.route('/:id')
  .get(authorize('admin'), getEmployee)
  .put(authorize('admin'), employeeUpdateValidation, handleValidation, updateEmployee)
  .delete(authorize('admin'), deleteEmployee);

module.exports = router;
