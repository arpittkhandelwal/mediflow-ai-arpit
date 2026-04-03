/**
 * OCR SERVICE — Tesseract.js
 * Extracts text from prescription images
 */

const Tesseract = require("tesseract.js");
const logger = require("../config/logger");

/**
 * Extract text from an image buffer using Tesseract
 * @param {Buffer} imageBuffer - Image file buffer
 * @returns {string} Extracted text
 */
const extractTextFromImage = async (imageBuffer) => {
  try {
    logger.info("Starting OCR processing...");

    const { data } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          logger.debug(`OCR progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const text = data.text.trim();
    logger.info(`OCR complete. Extracted ${text.length} characters`);

    return {
      text,
      confidence: data.confidence,
      words:
        data.words?.map((w) => ({ text: w.text, confidence: w.confidence })) ||
        [],
    };
  } catch (err) {
    logger.error(`OCR error: ${err.message}`);
    throw new Error("Failed to extract text from image: " + err.message);
  }
};

/**
 * Basic medicine parser (regex-based fallback if AI unavailable)
 */
const basicParseMedicines = (text) => {
  const lines = text.split("\n").filter((l) => l.trim().length > 2);
  const medicines = [];

  // Common patterns: "Tab. Amoxicillin 500mg", "Inj. Paracetamol", "#1 - Metformin..."
  const medicinePattern =
    /(?:tab\.?|cap\.?|inj\.?|syp\.?|drops?\.?|oint\.?)?\s*([A-Za-z]+(?:\s+[A-Za-z]+)?)\s+(\d+(?:\.\d+)?(?:mg|ml|mcg|g|IU)?)/gi;

  lines.forEach((line) => {
    let match;
    while ((match = medicinePattern.exec(line)) !== null) {
      medicines.push({
        name: match[1].trim(),
        dosage: match[2].trim(),
        frequency: "As prescribed",
        raw_line: line.trim(),
      });
    }
  });

  return medicines.length > 0
    ? medicines
    : lines.map((l) => ({ raw_line: l, name: l }));
};

module.exports = { extractTextFromImage, basicParseMedicines };
