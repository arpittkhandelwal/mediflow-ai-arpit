/**
 * Groq AI Client Configuration
 * Used for: Symptom Analysis, Patient Summaries, AI Chatbot
 */

const Groq = require("groq-sdk");
const logger = require("./logger");

if (!process.env.GROQ_API_KEY) {
  logger.warn("⚠️  GROQ_API_KEY not set - AI features will be limited");
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "dummy-key",
});

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

logger.info(`✅ Groq AI client initialized with model: ${GROQ_MODEL}`);

module.exports = { groq, GROQ_MODEL };
