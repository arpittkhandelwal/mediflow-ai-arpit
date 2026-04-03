const express = require('express');
const router = express.Router();
const multer = require('multer');
const { scanPrescription } = require('../controllers/ocrController');
const { optionalAuth } = require('../middlewares/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/gif','image/webp','application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/', optionalAuth, upload.single('image'), scanPrescription);

module.exports = router;
