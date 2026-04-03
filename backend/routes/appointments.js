const express = require("express");
const router = express.Router();
const {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAvailableSlots,
} = require("../controllers/appointmentController");
const { authenticate } = require("../middlewares/auth");
const {
  bookAppointmentValidator,
  validateRequest,
} = require("../middlewares/validation");

router.use(authenticate);
router.post(
  "/book",
  bookAppointmentValidator,
  validateRequest,
  bookAppointment,
);
router.get("/", getAppointments);
router.patch("/status", updateAppointmentStatus);
router.get("/slots/:doctorId", getAvailableSlots);

module.exports = router;
