/**
 * PATIENT CONTROLLER
 * Handles patient profile, history, and data retrieval
 */

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

/**
 * GET /patient/profile
 * Get patient's full profile including patient-specific data
 */
const getProfile = async (req, res) => {
  try {
    // Fetch from users + patients joined
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    if (userError) throw userError;

    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      profile: {
        ...user,
        patient_details: patient || null
      }
    });
  } catch (err) {
    logger.error(`Get patient profile error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch patient profile' });
  }
};

/**
 * POST /patient/update
 * Update patient profile and medical details
 */
const updateProfile = async (req, res) => {
  try {
    const { name, age, gender, medical_history, contact, address } = req.body;

    // Update users table
    if (name) {
      await supabaseAdmin
        .from('users')
        .update({ name, updated_at: new Date().toISOString() })
        .eq('id', req.user.id);
    }

    // Upsert patients table
    const patientUpdate = {
      user_id: req.user.id,
      updated_at: new Date().toISOString()
    };
    if (age !== undefined) patientUpdate.age = age;
    if (gender) patientUpdate.gender = gender;
    if (medical_history) patientUpdate.medical_history = medical_history;
    if (contact) patientUpdate.contact = contact;
    if (address) patientUpdate.address = address;

    const { error: patientError } = await supabaseAdmin
      .from('patients')
      .upsert(patientUpdate, { onConflict: 'user_id' });

    if (patientError) throw patientError;

    logger.info(`Patient profile updated: ${req.user.id}`);
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    logger.error(`Update patient profile error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * GET /patient/history
 * Get patient's full medical history including appointments and prescriptions
 */
const getMedicalHistory = async (req, res) => {
  try {
    // Get patient ID
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const patientId = patient.id;

    // Fetch appointments with doctor details
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        doctors (
          id,
          specialization,
          users (name, email)
        )
      `)
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    // Fetch prescriptions
    const { data: prescriptions } = await supabaseAdmin
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

    // Fetch reports
    const { data: reports } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });

    res.json({
      patient_id: patientId,
      appointments: appointments || [],
      prescriptions: prescriptions || [],
      reports: reports || []
    });
  } catch (err) {
    logger.error(`Get medical history error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch medical history' });
  }
};

/**
 * GET /patient/reminders
 * Get medicine reminders for patient
 */
const getReminders = async (req, res) => {
  try {
    const { data: patient } = await supabaseAdmin
      .from('patients')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!patient) {
      return res.status(404).json({ error: 'Patient profile not found' });
    }

    const { data: prescriptions } = await supabaseAdmin
      .from('prescriptions')
      .select('medicines, notes, created_at')
      .eq('patient_id', patient.id)
      .order('created_at', { ascending: false })
      .limit(5); // Latest 5 prescriptions

    // Extract medicines as reminders
    const reminders = [];
    if (prescriptions) {
      prescriptions.forEach(prescription => {
        if (prescription.medicines && Array.isArray(prescription.medicines)) {
          prescription.medicines.forEach(med => {
            reminders.push({
              medicine: med.name || med,
              dosage: med.dosage || 'As prescribed',
              frequency: med.frequency || 'Daily',
              notes: prescription.notes,
              prescribed_at: prescription.created_at
            });
          });
        }
      });
    }

    res.json({ reminders });
  } catch (err) {
    logger.error(`Get reminders error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
};

module.exports = { getProfile, updateProfile, getMedicalHistory, getReminders };
