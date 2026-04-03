/**
 * PRESCRIPTIONS CONTROLLER
 * Handles prescription retrieval for patients and doctors
 */

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

/**
 * GET /prescriptions/:patientId
 * Get all prescriptions for a patient
 */
const getPrescriptions = async (req, res) => {
  try {
    const { patientId } = req.params;

    const { data: prescriptions, error } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        doctors (
          id,
          specialization,
          users (name)
        )
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ prescriptions: prescriptions || [] });
  } catch (err) {
    logger.error(`Get prescriptions error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

/**
 * GET /prescriptions/my
 * Get prescriptions for the logged-in patient
 */
const getMyPrescriptions = async (req, res) => {
  try {
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const { data: prescriptions, error } = await supabaseAdmin
      .from('prescriptions')
      .select(`
        *,
        doctors (
          id,
          specialization,
          users (name)
        )
      `)
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ prescriptions: prescriptions || [] });
  } catch (err) {
    logger.error(`Get my prescriptions error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
};

module.exports = { getPrescriptions, getMyPrescriptions };
