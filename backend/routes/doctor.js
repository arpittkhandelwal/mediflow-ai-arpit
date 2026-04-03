const express = require("express");
const router = express.Router();
const {
  getPatients,
  getPatientById,
  createPrescription,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors,
} = require("../controllers/doctorController");
const { authenticate, requireDoctor } = require("../middlewares/auth");
const {
  prescriptionValidator,
  validateRequest,
} = require("../middlewares/validation");

// Public
router.get("/all", getAllDoctors);

// Protected
router.use(authenticate);
router.get("/profile", getDoctorProfile);
router.post("/update", updateDoctorProfile);
router.get("/patients", requireDoctor, getPatients);
router.get("/patient/:id", requireDoctor, getPatientById);
router.post(
  "/prescription",
  requireDoctor,
  prescriptionValidator,
  validateRequest,
  createPrescription,
);

module.exports = router;
