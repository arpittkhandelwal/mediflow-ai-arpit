/**
 * APPOINTMENTS CONTROLLER
 * Handles booking, listing, and updating appointments
 */

const { supabaseAdmin } = require("../config/supabase");
const logger = require("../config/logger");

/**
 * POST /appointments/book
 * Book a new appointment
 */
const bookAppointment = async (req, res) => {
  try {
    const { doctor_id, date, notes, slot_time } = req.body;

    // Get patient ID from user
    const { data: patient, error: patientError } = await supabaseAdmin
      .from("patients")
      .select("id")
      .eq("user_id", req.user.id)
      .single();

    if (patientError || !patient) {
      return res
        .status(404)
        .json({
          error: "Patient profile not found. Please complete your profile.",
        });
    }

    // Check if doctor exists
    const { data: doctor, error: docError } = await supabaseAdmin
      .from("doctors")
      .select("id, users(name)")
      .eq("id", doctor_id)
      .single();

    if (docError || !doctor) {
      return res.status(404).json({ error: "Doctor not found" });
    }

    // Check for duplicate booking (same doctor, same date+time)
    const { data: existing } = await supabaseAdmin
      .from("appointments")
      .select("id")
      .eq("doctor_id", doctor_id)
      .eq("date", date)
      .eq("slot_time", slot_time)
      .neq("status", "cancelled");

    if (existing && existing.length > 0) {
      return res
        .status(409)
        .json({
          error: "This slot is already booked. Please choose another time.",
        });
    }

    // Create appointment
    const { data: appointment, error } = await supabaseAdmin
      .from("appointments")
      .insert([
        {
          patient_id: patient.id,
          doctor_id,
          date,
          slot_time: slot_time || null,
          notes: notes || null,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    logger.info(
      `Appointment booked: patient=${patient.id}, doctor=${doctor_id}, date=${date}`,
    );

    res.status(201).json({
      message: "Appointment booked successfully!",
      appointment: {
        ...appointment,
        doctor_name: doctor.users?.name,
      },
    });
  } catch (err) {
    logger.error(`Book appointment error: ${err.message}`);
    res.status(500).json({ error: "Failed to book appointment" });
  }
};

/**
 * GET /appointments
 * Get appointments for the logged-in user (patient or doctor)
 */
const getAppointments = async (req, res) => {
  try {
    // Get user profile
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("role")
      .eq("id", req.user.id)
      .single();

    let appointments;

    if (userProfile?.role === "doctor") {
      const { data: doctor } = await supabaseAdmin
        .from("doctors")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      if (!doctor) return res.json({ appointments: [] });

      const result = await supabaseAdmin
        .from("appointments")
        .select(
          `
          *,
          patients (
            id, age, gender,
            users (name, email)
          )
        `,
        )
        .eq("doctor_id", doctor.id)
        .order("date", { ascending: false });

      appointments = result.data;
    } else {
      // Patient view
      const { data: patient } = await supabaseAdmin
        .from("patients")
        .select("id")
        .eq("user_id", req.user.id)
        .single();

      if (!patient) return res.json({ appointments: [] });

      const result = await supabaseAdmin
        .from("appointments")
        .select(
          `
          *,
          doctors (
            id, specialization,
            users (name, email)
          )
        `,
        )
        .eq("patient_id", patient.id)
        .order("date", { ascending: false });

      appointments = result.data;
    }

    res.json({ appointments: appointments || [] });
  } catch (err) {
    logger.error(`Get appointments error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch appointments" });
  }
};

/**
 * PATCH /appointments/status
 * Update appointment status (confirm/cancel/complete)
 */
const updateAppointmentStatus = async (req, res) => {
  try {
    const { appointment_id, status } = req.body;

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res
        .status(400)
        .json({
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
        });
    }

    // Verify the user owns/is assigned this appointment
    const { data: appointment } = await supabaseAdmin
      .from("appointments")
      .select("*, patients(user_id), doctors(user_id)")
      .eq("id", appointment_id)
      .single();

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }

    const isPatient = appointment.patients?.user_id === req.user.id;
    const isDoctor = appointment.doctors?.user_id === req.user.id;

    if (!isPatient && !isDoctor) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this appointment" });
    }

    const { data: updated, error } = await supabaseAdmin
      .from("appointments")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", appointment_id)
      .select()
      .single();

    if (error) throw error;

    logger.info(`Appointment ${appointment_id} status updated to ${status}`);
    res.json({ message: "Appointment updated", appointment: updated });
  } catch (err) {
    logger.error(`Update appointment status error: ${err.message}`);
    res.status(500).json({ error: "Failed to update appointment" });
  }
};

/**
 * GET /appointments/slots/:doctorId
 * Get available slots for a doctor on a given date
 */
const getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }

    // Get booked slots for this doctor on this date
    const { data: booked } = await supabaseAdmin
      .from("appointments")
      .select("slot_time")
      .eq("doctor_id", doctorId)
      .eq("date", date)
      .neq("status", "cancelled");

    const bookedSlots = new Set((booked || []).map((a) => a.slot_time));

    // Generate slots from 9am to 5pm (30 min intervals)
    const allSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min of [0, 30]) {
        const time = `${hour.toString().padStart(2, "0")}:${min.toString().padStart(2, "0")}`;
        allSlots.push({
          time,
          available: !bookedSlots.has(time),
          label: new Date(`2000-01-01T${time}:00`).toLocaleTimeString("en-IN", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        });
      }
    }

    res.json({ date, slots: allSlots });
  } catch (err) {
    logger.error(`Get slots error: ${err.message}`);
    res.status(500).json({ error: "Failed to fetch available slots" });
  }
};

module.exports = {
  bookAppointment,
  getAppointments,
  updateAppointmentStatus,
  getAvailableSlots,
};
