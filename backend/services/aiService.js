/**
 * AI SERVICE — Groq API Integration
 * Symptom Checker, Patient Summary, AI Chatbot
 */

const { groq, GROQ_MODEL } = require("../config/groq");
const logger = require("../config/logger");

// System prompt shared across features
const SYSTEM_PROMPT = `You are Asha, an empathetic AI health assistant for MediFlow AI — 
a premium Indian healthcare platform. You provide helpful, accurate, and compassionate 
health guidance. Always remind users to consult a real doctor for diagnosis and treatment. 
Never prescribe specific medicines. Be concise and clear. Support both English and Hindi.`;

/**
 * Analyze symptoms and return possible conditions + urgency
 */
const analyzeSymptoms = async ({ symptoms, age, gender }) => {
  const userCtx = age && gender ? `Patient: ${age}y/o ${gender}.` : "";

  const prompt = `${userCtx}
Patient reports: "${symptoms}"

Respond in this EXACT JSON format:
{
  "possible_conditions": ["condition1", "condition2", "condition3"],
  "urgency_level": "low|medium|high|emergency",
  "urgency_message": "Short explanation of urgency",
  "recommended_specialist": "e.g. General Physician, Cardiologist, etc.",
  "home_care_tips": ["tip1", "tip2"],
  "when_to_seek_help": "specific warning signs",
  "disclaimer": "Always consult a qualified doctor for proper diagnosis."
}`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 600,
    response_format: { type: "json_object" },
  });

  let result;
  try {
    result = JSON.parse(completion.choices[0].message.content);
  } catch {
    result = { raw: completion.choices[0].message.content };
  }

  logger.info(
    `Symptom analysis completed for: ${symptoms.substring(0, 50)}...`,
  );
  return result;
};

/**
 * Generate AI summary of patient's medical history
 */
const generatePatientSummary = async (medicalHistory) => {
  const historyText =
    typeof medicalHistory === "object"
      ? JSON.stringify(medicalHistory, null, 2)
      : medicalHistory;

  const prompt = `Summarize this patient's medical history in a concise, professional manner 
for a doctor's quick reference (max 150 words). Highlight key conditions, allergies, 
and important notes:\n\n${historyText}`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    max_tokens: 300,
  });

  return completion.choices[0].message.content;
};

/**
 * Conversational health chatbot
 */
const chat = async ({ message, conversationHistory = [] }) => {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    ...conversationHistory.slice(-10), // Keep last 10 messages for context
    { role: "user", content: message },
  ];

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages,
    temperature: 0.7,
    max_tokens: 500,
  });

  const reply = completion.choices[0].message.content;

  logger.info(`AI chat response generated`);
  return {
    reply,
    updated_history: [
      ...conversationHistory,
      { role: "user", content: message },
      { role: "assistant", content: reply },
    ],
  };
};

/**
 * Parse and structure extracted OCR text from prescription
 */
const parsePrescriptionText = async (rawText) => {
  const prompt = `Extract medicines and dosage from this prescription text. 
Return JSON: { "medicines": [{ "name": "...", "dosage": "...", "frequency": "...", "duration": "..." }], "doctor_notes": "...", "patient_name": "..." }

Prescription text:
${rawText}`;

  const completion = await groq.chat.completions.create({
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are a medical prescription parser. Extract structured data from prescription text. Return valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 400,
    response_format: { type: "json_object" },
  });

  try {
    return JSON.parse(completion.choices[0].message.content);
  } catch {
    return { medicines: [], raw_text: rawText };
  }
};

module.exports = {
  analyzeSymptoms,
  generatePatientSummary,
  chat,
  parsePrescriptionText,
};
