/**
 * AI CONTROLLER
 * Routes for Symptom Checker, Summaries, and Chatbot
 */

const aiService = require("../services/aiService");
const { supabaseAdmin } = require("../config/supabase");
const logger = require("../config/logger");

/** POST /ai/symptoms — Analyze symptoms */
const checkSymptoms = async (req, res) => {
  try {
    const { symptoms, age, gender } = req.body;
    const result = await aiService.analyzeSymptoms({ symptoms, age, gender });

    // Optionally log the analysis to DB for records
    if (req.user) {
      const { data: patient } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();
      if (patient) {
        await supabaseAdmin
          .from("symptom_logs")
          .insert([
            {
              patient_id: patient.id,
              symptoms,
              result,
              created_at: new Date().toISOString(),
            },
          ])
          .catch(() => {}); // Non-critical, ignore errors
      }
    }

    res.json({ success: true, analysis: result });
  } catch (err) {
    logger.error(`Symptom check error: ${err.message}`);
    res.status(500).json({ error: "AI analysis failed. Please try again." });
  }
};

/** POST /ai/summary — Generate patient summary */
const generateSummary = async (req, res) => {
  try {
    const { medical_history, patient_id } = req.body;

    let historyData = medical_history;

    // If patient_id provided, fetch from DB
    if (!historyData && patient_id) {
      const { data } = await supabaseAdmin
        .from("patients")
        .select("medical_history")
        .eq("id", patient_id)
        .single();
      historyData = data?.medical_history;
    }

    if (!historyData) {
      return res.status(400).json({ error: "No medical history provided" });
    }

    const summary = await aiService.generatePatientSummary(historyData);
    res.json({ success: true, summary });
  } catch (err) {
    logger.error(`Summary error: ${err.message}`);
    res.status(500).json({ error: "Failed to generate summary" });
  }
};

/** POST /ai/chat — Conversational health assistant */
const chat = async (req, res) => {
  try {
    const { message, conversation_history } = req.body;
    const result = await aiService.chat({
      message,
      conversationHistory: conversation_history || [],
    });
    res.json({ success: true, ...result });
  } catch (err) {
    logger.error(`Chat error: ${err.message}`);
    res.status(500).json({ error: "AI chat failed. Please try again." });
  }
};

module.exports = { checkSymptoms, generateSummary, chat };
