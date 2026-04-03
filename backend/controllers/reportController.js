/**
 * REPORTS CONTROLLER
 * Handles medical report upload and retrieval via Supabase Storage
 */

const { supabaseAdmin } = require("../config/supabase");
const logger = require("../config/logger");
const path = require("path");

/**
 * POST /reports/upload
 * Upload a medical report (PDF, image) to Supabase Storage
 */
const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    // Get patient ID
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const file = req.file;
    const fileExt = path.extname(file.originalname);
    const fileName = `${patient.id}/${Date.now()}${fileExt}`;

    // Upload to Supabase Storage bucket 'reports'
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("reports")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error(`Storage upload error: ${uploadError.message}`);
      // Fallback: store as local URL for MVP
      const localUrl = `/uploads/${file.filename}`;
      await createReportRecord(
        patient.id,
        localUrl,
        file.originalname,
        req.body.report_type,
      );
      return res
        .status(201)
        .json({ message: "Report uploaded (local)", file_url: localUrl });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("reports")
      .getPublicUrl(fileName);

    const fileUrl = urlData.publicUrl;

    // Save report record in DB
    const report = await createReportRecord(
      patient.id,
      fileUrl,
      file.originalname,
      req.body.report_type || "lab_report",
    );

    logger.info(`Report uploaded for patient ${patient.id}: ${fileUrl}`);

    res.status(201).json({
      message: "Report uploaded successfully",
      report,
      file_url: fileUrl,
    });
  } catch (err) {
    logger.error(`Upload report error: ${err.message}`);
    res.status(500).json({ error: "Failed to upload report" });
  }
};

/**
 * Helper: Insert report record into DB
 */
const createReportRecord = async (patientId, fileUrl, fileName, reportType) => {
  const { data, error } = await supabaseAdmin
    .from("reports")
    .insert([
      {
        patient_id: patientId,
        file_url: fileUrl,
        file_name: fileName,
        report_type: reportType || "lab_report",
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * GET /reports/:patientId
 * Get all reports for a patient
 */
const getReports = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data: reports, error } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ reports: reports || [] });
  } catch (err) {
    logger.error(`Get reports error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

/**
 * GET /reports/my
 * Get reports for the logged-in patient
 */
const getMyReports = async (req, res) => {
  try {
    const { data: patient } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: "Patient profile not found" });
    }

    const { data: reports, error } = await supabaseAdmin
      .from("reports")
      .select("*")
      .eq("patient_id", patient.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ reports: reports || [] });
  } catch (err) {
    logger.error(`Get my reports error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch reports" });
  }
};

module.exports = { uploadReport, getReports, getMyReports };
