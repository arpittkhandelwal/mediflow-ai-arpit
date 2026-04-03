const express = require("express");
const router = express.Router();
const {
  getPrescriptions,
  getMyPrescriptions,
} = require("../controllers/prescriptionController");
const { authenticate } = require("../middlewares/auth");

router.use(authenticate);
router.get("/my", getMyPrescriptions);
router.get("/:patientId", getPrescriptions);

module.exports = router;
