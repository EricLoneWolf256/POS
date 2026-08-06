import { body, param, query, validationResult } from 'express-validator';

const ROLES = ['owner', 'admin', 'manager', 'cashier', 'field_sales', 'viewer'];
const PAYMENT_METHODS = ['cash', 'mobile_money', 'card', 'bank_transfer', 'credit', 'mixed'];
const SALE_STATUSES = ['completed', 'pending', 'cancelled', 'refunded'];

export function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

export function validateIdParam(paramName = 'id') {
  return [
    param(paramName).isInt({ min: 1 }).withMessage(`${paramName} must be a positive integer`),
  ];
}

export function validatePagination() {
  return [
    query('page').optional().isInt({ min: 1 }).withMessage('page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 200 }).withMessage('limit must be between 1 and 200'),
  ];
}

export function validateEmail(field = 'email') {
  return body(field)
    .trim()
    .isEmail().withMessage('Must be a valid email address')
    .normalizeEmail();
}

export function validatePassword(field = 'password', minLength = 6) {
  return body(field)
    .isLength({ min: minLength }).withMessage(`Password must be at least ${minLength} characters`);
}

export function validateRequiredString(field, minLength = 1, maxLength = 255) {
  return body(field)
    .trim()
    .isLength({ min: minLength, max: maxLength }).withMessage(`${field} must be between ${minLength} and ${maxLength} characters`)
    .escape();
}

export function validateOptionalString(field, maxLength = 255) {
  return body(field)
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: maxLength }).withMessage(`${field} must be at most ${maxLength} characters`)
    .escape();
}

export function validatePositiveNumber(field, allowZero = false) {
  const min = allowZero ? 0 : 0.01;
  return body(field)
    .isFloat({ min }).withMessage(`${field} must be a positive number`);
}

export function validateOptionalPositiveNumber(field) {
  return body(field)
    .optional({ values: 'null' })
    .isFloat({ min: 0 }).withMessage(`${field} must be a non-negative number`);
}

export function validateEnum(field, allowedValues) {
  return body(field)
    .optional({ values: 'null' })
    .isIn(allowedValues).withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
}

export function validateBoolean(field) {
  return body(field)
    .optional()
    .isBoolean().withMessage(`${field} must be a boolean`);
}

export function validateISODate(field) {
  return body(field)
    .optional({ values: 'null' })
    .isISO8601().withMessage(`${field} must be a valid date`);
}

export function validateOptionalEmail(field) {
  return body(field)
    .optional({ values: 'null' })
    .trim()
    .isEmail().withMessage(`Must be a valid email address`)
    .normalizeEmail();
}

const validation = {
  handleValidation,
  validateIdParam,
  validatePagination,
  validateEmail,
  validatePassword,
  validateRequiredString,
  validateOptionalString,
  validatePositiveNumber,
  validateOptionalPositiveNumber,
  validateEnum,
  validateBoolean,
  validateISODate,
  validateOptionalEmail,
  ROLES,
  PAYMENT_METHODS,
  SALE_STATUSES,
};

export default validation;
