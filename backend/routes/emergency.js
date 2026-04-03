const express = require("express");
const router = express.Router();
const {
  activateSOS,
  resolveEmergency,
  getEmergencyHistory,
  trackEmergency,
} = require("../controllers/emergencyController");
const { authenticate } = require("../middlewares/auth");
const {
  emergencyValidator,
  validateRequest,
} = require("../middlewares/validation");

router.use(authenticate);
router.post("/sos", emergencyValidator, validateRequest, activateSOS);
router.patch("/resolve/:id", resolveEmergency);
router.get("/history", getEmergencyHistory);
router.get("/track/:id", trackEmergency);

module.exports = router;
