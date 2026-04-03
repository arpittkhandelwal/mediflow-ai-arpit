/**
 * VALIDATION MIDDLEWARE
 * Input validation for all routes using express-validator
 */

const { body, param, query, validationResult } = require("express-validator");

/**
 * Check validation results - call after validation rules
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value,
      })),
    });
  }
  next();
};

// Auth validators
const signupValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Password must contain uppercase, lowercase, and number"),
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 }),
  body("role")
    .isIn(["patient", "doctor"])
    .withMessage("Role must be patient or doctor"),
];

const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

// Patient validators
const patientUpdateValidator = [
  body("age")
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage("Valid age required"),
  body("gender")
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Valid gender required"),
  body("medical_history").optional().isString(),
];

// Appointment validators
const bookAppointmentValidator = [
  body("doctor_id").isUUID().withMessage("Valid doctor ID required"),
  body("date").isISO8601().withMessage("Valid date required (ISO 8601 format)"),
  body("notes").optional().isString().isLength({ max: 500 }),
];

// Prescription validators
const prescriptionValidator = [
  body("patient_id").isUUID().withMessage("Valid patient ID required"),
  body("medicines").isArray().withMessage("Medicines must be an array"),
  body("medicines.*.name").notEmpty().withMessage("Medicine name required"),
  body("medicines.*.dosage").notEmpty().withMessage("Dosage required"),
  body("notes").optional().isString().isLength({ max: 1000 }),
];

// Emergency validators
const emergencyValidator = [
  body("latitude")
    .isFloat({ min: -90, max: 90 })
    .withMessage("Valid latitude required"),
  body("longitude")
    .isFloat({ min: -180, max: 180 })
    .withMessage("Valid longitude required"),
  body("message").optional().isString().isLength({ max: 500 }),
];

// AI validators
const symptomValidator = [
  body("symptoms")
    .trim()
    .notEmpty()
    .withMessage("Symptoms description required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Symptoms must be 10-2000 characters"),
  body("age").optional().isInt({ min: 0, max: 150 }),
  body("gender").optional().isIn(["male", "female", "other"]),
];

const chatValidator = [
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Message is required")
    .isLength({ max: 1000 })
    .withMessage("Message too long (max 1000 chars)"),
  body("conversation_history").optional().isArray(),
];

module.exports = {
  validateRequest,
  signupValidator,
  loginValidator,
  patientUpdateValidator,
  bookAppointmentValidator,
  prescriptionValidator,
  emergencyValidator,
  symptomValidator,
  chatValidator,
};
