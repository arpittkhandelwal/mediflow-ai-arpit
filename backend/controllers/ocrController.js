/**
 * OCR CONTROLLER
 * Prescription Scanner — extract text + parse medicines via Tesseract + Groq
 */

const { extractTextFromImage } = require("../services/ocrService");
const {
  parsePrescriptionText,
  basicParseMedicines,
} = require("../services/aiService");
const logger = require("../config/logger");

/** POST /scan-prescription — Upload image, extract text, parse medicines */
const scanPrescription = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ error: "Please upload an image file (JPG, PNG, PDF)" });
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
    ];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res
        .status(400)
        .json({ error: "Invalid file type. Please upload JPG, PNG, or PDF." });
    }

    logger.info(
      `Processing prescription scan: ${req.file.originalname} (${req.file.size} bytes)`,
    );

    // Step 1: Extract text via Tesseract OCR
    const { text, confidence } = await extractTextFromImage(req.file.buffer);

    if (!text || text.length < 10) {
      return res.status(422).json({
        error:
          "Could not extract readable text from this image. Please ensure the image is clear and well-lit.",
        raw_text: text,
      });
    }

    // Step 2: Parse medicines via Groq AI
    let parsed;
    try {
      const {
        parsePrescriptionText: aiParse,
      } = require("../services/aiService");
      parsed = await aiParse(text);
    } catch (aiErr) {
      logger.warn(
        `Groq parsing failed, using regex fallback: ${aiErr.message}`,
      );
      const { basicParseMedicines } = require("../services/ocrService");
      parsed = {
        medicines: basicParseMedicines(text),
        doctor_notes: "",
        patient_name: "",
      };
    }

    res.json({
      success: true,
      ocr: { confidence: Math.round(confidence), raw_text: text },
      parsed: {
        medicines: parsed.medicines || [],
        doctor_notes: parsed.doctor_notes || "",
        patient_name: parsed.patient_name || "",
      },
    });
  } catch (err) {
    logger.error(`OCR scan error: ${err.message}`);
    res
      .status(500)
      .json({
        error:
          "Prescription scan failed. Please try again with a clearer image.",
      });
  }
};

module.exports = { scanPrescription };
