const express = require("express");
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getMedicalHistory,
  getReminders,
} = require("../controllers/patientController");
const { authenticate, requirePatient } = require("../middlewares/auth");
const {
  patientUpdateValidator,
  validateRequest,
} = require("../middlewares/validation");

router.use(authenticate);
router.get("/profile", getProfile);
router.post("/update", patientUpdateValidator, validateRequest, updateProfile);
router.get("/history", getMedicalHistory);
router.get("/reminders", getReminders);

module.exports = router;
