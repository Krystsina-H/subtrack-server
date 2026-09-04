const { body, query, param } = require('express-validator');

const BILLING_CYCLES = ['daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'];
const SUBSCRIPTION_STATUSES = ['active', 'paused', 'cancelled'];
const PAYMENT_STATUSES = ['scheduled', 'paid', 'missed', 'cancelled'];
const CURRENCIES = ['RUB', 'USD', 'EUR', 'GBP', 'BYN'];

// POST /api/auth/register
exports.registerValidators = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('currency')
    .optional()
    .isIn(CURRENCIES)
    .withMessage('Invalid currency'),
  body('notifyDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('notifyDays must be between 0 and 30')
    .toInt(),
];

// POST /api/auth/login
exports.loginValidators = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// POST /api/subscriptions
exports.createSubscriptionValidators = [
  body('serviceName')
    .trim()
    .notEmpty()
    .withMessage('Service name is required')
    .isLength({ max: 100 })
    .withMessage('Service name cannot exceed 100 characters'),
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number')
    .toFloat(),
  body('billingCycle')
    .isIn(BILLING_CYCLES)
    .withMessage('Invalid billing cycle'),
  body('customCycleDays')
    .if(body('billingCycle').equals('custom'))
    .isInt({ min: 1 })
    .withMessage('customCycleDays is required and must be at least 1 when billingCycle is custom')
    .toInt(),
  body('startDate')
    .isISO8601()
    .withMessage('Valid start date is required')
    .toDate(),
];

// PUT /api/subscriptions/:id
exports.updateSubscriptionValidators = [
  body('serviceName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Service name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Service name cannot exceed 100 characters'),
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty')
    .isLength({ max: 50 })
    .withMessage('Category cannot exceed 50 characters'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a non-negative number')
    .toFloat(),
  body('billingCycle')
    .optional()
    .isIn(BILLING_CYCLES)
    .withMessage('Invalid billing cycle'),
  body('customCycleDays')
    .if(body('billingCycle').equals('custom'))
    .isInt({ min: 1 })
    .withMessage('customCycleDays must be at least 1 when billingCycle is custom')
    .toInt(),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date')
    .toDate(),
  body('status')
    .optional()
    .isIn(SUBSCRIPTION_STATUSES)
    .withMessage('Invalid subscription status'),
];

// PATCH /api/payments/:id/status
exports.updatePaymentStatusValidators = [
  body('status')
    .isIn(PAYMENT_STATUSES)
    .withMessage('Invalid status. Must be one of: scheduled, paid, missed, cancelled'),
];

exports.paymentQueryValidators = [
  query('month').optional().isInt({ min: 1, max: 12 }).withMessage('month must be between 1 and 12').toInt(),
  query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('year must be between 2000 and 2100').toInt(),
  query('dateFrom').optional().isISO8601().withMessage('dateFrom must be a valid date').toDate(),
  query('dateTo').optional().isISO8601().withMessage('dateTo must be a valid date').toDate(),
  query('status').optional().isIn(PAYMENT_STATUSES).withMessage('Invalid payment status'),
  query('subscriptionId').optional().isMongoId().withMessage('Invalid subscription ID'),
  query('page').optional().isInt({ min: 1 }).withMessage('page must be at least 1').toInt(),
  query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200').toInt(),
];

exports.subscriptionIdValidator = [
  param('id').isMongoId().withMessage('Invalid subscription ID'),
];

exports.paymentIdValidator = [
  param('id').isMongoId().withMessage('Invalid payment ID'),
];

// PUT /api/user/profile
exports.updateProfileValidators = [
  body('currency')
    .optional()
    .isIn(CURRENCIES)
    .withMessage('Invalid currency'),
  body('notifyDays')
    .optional()
    .isInt({ min: 0, max: 30 })
    .withMessage('notifyDays must be between 0 and 30')
    .toInt(),
  body('currentPassword')
    .optional()
    .isString(),
  body('newPassword')
    .optional()
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];
