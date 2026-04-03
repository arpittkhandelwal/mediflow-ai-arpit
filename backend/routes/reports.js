const express = require("express");
const router = express.Router();
const multer = require("multer");
const {
  uploadReport,
  getReports,
  getMyReports,
} = require("../controllers/reportController");
const { authenticate } = require("../middlewares/auth");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      "image/jpeg",
      "image/png",
      "application/pdf",
      "image/webp",
    ];
    cb(null, allowed.includes(file.mimetype));
  },
});

router.use(authenticate);
router.post("/upload", upload.single("file"), uploadReport);
router.get("/my", getMyReports);
router.get("/:patientId", getReports);

module.exports = router;
