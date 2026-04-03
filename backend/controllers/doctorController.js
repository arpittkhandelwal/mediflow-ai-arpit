/**
 * DOCTOR CONTROLLER
 * Handles doctor's patient list, prescriptions, and appointments
 */

const { supabaseAdmin } = require('../config/supabase');
const logger = require('../config/logger');

/**
 * GET /doctor/patients
 * Get list of all patients who have appointments with this doctor
 */
const getPatients = async (req, res) => {
  try {
    // Get doctor ID
    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    // Get all unique patients with appointments
    const { data: appointments, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        patient_id,
        patients (
          id,
          age,
          gender,
          users (id, name, email)
        )
      `)
      .eq('doctor_id', doctor.id);

    if (error) throw error;

    // Deduplicate patients
    const patientMap = new Map();
    appointments?.forEach(appt => {
      if (appt.patients && !patientMap.has(appt.patient_id)) {
        patientMap.set(appt.patient_id, {
          id: appt.patients.id,
          age: appt.patients.age,
          gender: appt.patients.gender,
          name: appt.patients.users?.name,
          email: appt.patients.users?.email,
          user_id: appt.patients.users?.id
        });
      }
    });

    res.json({ patients: Array.from(patientMap.values()) });
  } catch (err) {
    logger.error(`Get doctor patients error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
};

/**
 * GET /doctor/patient/:id
 * Get detailed info for a specific patient
 */
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: patient, error } = await supabaseAdmin
      .from('patients')
      .select(`
        *,
        users (id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Get their appointments, prescriptions, reports
    const [appointmentsResult, prescriptionsResult, reportsResult] = await Promise.all([
      supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('patient_id', id)
        .order('date', { ascending: false }),
      supabaseAdmin
        .from('prescriptions')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from('reports')
        .select('*')
        .eq('patient_id', id)
        .order('created_at', { ascending: false })
    ]);

    res.json({
      patient: {
        ...patient,
        appointments: appointmentsResult.data || [],
        prescriptions: prescriptionsResult.data || [],
        reports: reportsResult.data || []
      }
    });
  } catch (err) {
    logger.error(`Get patient by ID error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch patient details' });
  }
};

/**
 * POST /doctor/prescription
 * Create a new prescription for a patient
 */
const createPrescription = async (req, res) => {
  try {
    const { patient_id, medicines, notes } = req.body;

    // Get doctor ID
    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor profile not found' });
    }

    const { data: prescription, error } = await supabaseAdmin
      .from('prescriptions')
      .insert([{
        patient_id,
        doctor_id: doctor.id,
        medicines,
        notes,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    logger.info(`Prescription created by doctor ${req.user.id} for patient ${patient_id}`);
    res.status(201).json({
      message: 'Prescription created successfully',
      prescription
    });
  } catch (err) {
    logger.error(`Create prescription error: ${err.message}`);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
};

/**
 * GET /doctor/profile
 * Get doctor's own profile
 */
const getDoctorProfile = async (req, res) => {
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();

    const { data: doctor } = await supabaseAdmin
      .from('doctors')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    res.json({
      profile: {
        ...user,
        doctor_details: doctor || null
      }
    });
  } catch (err) {
    logger.error(`Get doctor profile error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch doctor profile' });
  }
};

/**
 * POST /doctor/update
 * Update doctor's specialization and profile
 */
const updateDoctorProfile = async (req, res) => {
  try {
    const { name, specialization, qualification, experience, consultation_fee } = req.body;

    if (name) {
      await supabaseAdmin
        .from('users')
        .update({ name })
        .eq('id', req.user.id);
    }

    const doctorUpdate = { user_id: req.user.id };
    if (specialization) doctorUpdate.specialization = specialization;
    if (qualification) doctorUpdate.qualification = qualification;
    if (experience !== undefined) doctorUpdate.experience = experience;
    if (consultation_fee !== undefined) doctorUpdate.consultation_fee = consultation_fee;

    await supabaseAdmin
      .from('doctors')
      .upsert(doctorUpdate, { onConflict: 'user_id' });

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    logger.error(`Update doctor profile error: ${err.message}`);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

/**
 * GET /doctor/all
 * Get list of all doctors (for Find a Doctor page)
 * Public endpoint
 */
const getAllDoctors = async (req, res) => {
  try {
    const { specialization, name } = req.query;

    let query = supabaseAdmin
      .from('doctors')
      .select(`
        id,
        specialization,
        qualification,
        experience,
        consultation_fee,
        users (id, name, email)
      `);

    if (specialization) {
      query = query.ilike('specialization', `%${specialization}%`);
    }

    const { data: doctors, error } = await query;

    if (error) throw error;

    let filtered = doctors || [];

    if (name) {
      filtered = filtered.filter(d =>
        d.users?.name?.toLowerCase().includes(name.toLowerCase())
      );
    }

    const formatted = filtered.map(d => ({
      id: d.id,
      name: d.users?.name || 'Dr. Unknown',
      email: d.users?.email,
      specialization: d.specialization || 'General Physician',
      qualification: d.qualification || 'MBBS',
      experience: d.experience || 0,
      consultation_fee: d.consultation_fee || 500,
      rating: (Math.random() * 1 + 4).toFixed(1), // Demo rating
      available: true
    }));

    res.json({ doctors: formatted });
  } catch (err) {
    logger.error(`Get all doctors error: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
};

module.exports = {
  getPatients,
  getPatientById,
  createPrescription,
  getDoctorProfile,
  updateDoctorProfile,
  getAllDoctors
};
