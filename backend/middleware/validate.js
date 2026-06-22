const { body, validationResult } = require('express-validator');

// ─── Handle validation errors ──────────────────────────────────────────────
exports.handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth validators ───────────────────────────────────────────────────────
exports.registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('role').optional().isIn(['user', 'employee']).withMessage('Role must be user or employee'),
];

exports.loginValidation = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
  body('role').isIn(['admin', 'user', 'employee']).withMessage('Role is required'),
];

// ─── Employee validators ───────────────────────────────────────────────────
exports.employeeValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('department')
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isIn(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'])
    .withMessage('Invalid department'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('salary').isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
  body('phone').optional().matches(/^\+?[\d\s\-()]{7,15}$/).withMessage('Invalid phone number'),
];

exports.employeeUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 100 }),
  body('email').optional().trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('department')
    .optional()
    .isIn(['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'])
    .withMessage('Invalid department'),
  body('position').optional().trim().notEmpty().withMessage('Position cannot be empty'),
  body('salary').optional().isFloat({ min: 0 }).withMessage('Salary must be a positive number'),
];

exports.productValidation = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];

exports.productUpdateValidation = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 150 }),
  body('description').optional().trim().isLength({ max: 500 }),
  body('price').optional().isFloat({ min: 0 }).withMessage('Price must be a positive number'),
];
