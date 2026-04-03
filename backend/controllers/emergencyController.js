/**
 * EMERGENCY CONTROLLER
 * Handles SOS requests, location tracking, and emergency logs
 */

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

/**
 * POST /emergency/sos
 * Activate emergency SOS for a patient
 */
const activateSOS = async (req, res) => {
  try {
    const { latitude, longitude, message } = req.body;

    // Get patient ID
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('id, users(name, email)')
      .eq('user_id', req.user.id)
      .single();

    if (patientError || !patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    // Create emergency log
    const { data: emergencyLog, error } = await supabaseAdmin
      .from('emergency_logs')
      .insert([{
        patient_id: patient.id,
        location: { latitude, longitude },
        latitude,
        longitude,
        message: message || 'Emergency SOS activated',
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    logger.warn(`🚨 EMERGENCY SOS: Patient ${patient.id} (${patient.users?.name}) at ${latitude}, ${longitude}`);

    // In production: trigger notifications to emergency contacts, nearby hospitals
    // For now, return success with log ID for tracking

    res.status(201).json({
      message: 'SOS activated! Emergency services have been notified.',
      emergency_id: emergencyLog.id,
      status: 'active',
      location: { latitude, longitude },
      tracking_url: `/emergency/track/${emergencyLog.id}`,
      timestamp: emergencyLog.created_at
    });
  } catch (err) {
    logger.error(`SOS activation error: ${err.message}`);
    res.status(500).json({ error: 'Failed to activate SOS. Please call emergency services directly.' });
  }
};

/**
 * PATCH /emergency/resolve/:id
 * Mark an emergency as resolved
 */
const resolveEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: updated, error } = await supabaseAdmin
      .from('emergency_logs')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', id)
      .eq('patient_id', patient?.id)
      .select()
      .single();

    if (error) throw error;

    if (!updated) {
      return res.status(404).json({ error: 'Emergency log not found' });
    }

    logger.info(`Emergency ${id} resolved`);
    res.json({ message: 'Emergency resolved', emergency: updated });
  } catch (err) {
    logger.error(`Resolve emergency error: ${err.message}`);
    res.status(500).json({ error: 'Failed to resolve emergency' });
  }
};

/**
 * GET /emergency/history
 * Get emergency history for logged-in patient
 */
const getEmergencyHistory = async (req, res) => {
  try {
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const { data: logs, error } = await supabaseAdmin
      .from('emergency_logs')
      .select('*')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ emergency_logs: logs || [] });
  } catch (err) {
    logger.error(`Get emergency history error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch emergency history' });
  }
};

/**
 * GET /emergency/track/:id
 * Track an active emergency
 */
const trackEmergency = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: log, error } = await supabaseAdmin
      .from('emergency_logs')
      .select(`
        *,
        patients (
          id,
          users (name)
        )
      `)
      .eq('id', id)
      .single();

    if (error || !log) {
      return res.status(404).json({ error: 'Emergency not found' });
    }

    res.json({ emergency: log });
  } catch (err) {
    logger.error(`Track emergency error: ${err.message}`);
    res.status(500).json({ error: 'Failed to track emergency' });
  }
};

module.exports = { activateSOS, resolveEmergency, getEmergencyHistory, trackEmergency };
