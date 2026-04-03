import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { appointmentAPI } from "../services/api";
import toast from "react-hot-toast";

export default function SelectSlot() {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [slots, setSlots] = useState([]);
  const [selected, setSelected] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!date) return;
    setLoading(true);
    setSelected(null);
    appointmentAPI
      .getSlots(doctorId, date)
      .then((r) => setSlots(r.slots || []))
      .catch(() => toast.error("Failed to load slots"))
      .finally(() => setLoading(false));
  }, [date, doctorId]);

  const book = async () => {
    if (!selected) return toast.error("Please select a time slot");
    setBooking(true);
    try {
      await appointmentAPI.book({
        doctor_id: doctorId,
        date,
        slot_time: selected,
        notes,
      });
      navigate("/booking-success", {
        state: { date, slot_time: selected, doctor_id: doctorId },
      });
    } catch (e) {
      toast.error(e.message || "Booking failed");
    } finally {
      setBooking(false);
    }
  };

  // Min date: today
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <nav className="nav">
        <Link to="/find-doctor" className="nav-brand">
          ← Find a Doctor
        </Link>
      </nav>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
          Select Appointment Slot
        </h1>
        <p style={{ color: "var(--on-surface-var)", marginBottom: "2rem" }}>
          Choose your preferred date and time
        </p>

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="label">Select Date</label>
            <input
              className="input"
              type="date"
              min={minDate}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner" style={{ margin: "0 auto" }} />
          </div>
        ) : (
          <div className="card" style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem" }}>Available Slots — {date}</h3>
            <div className="slots-grid">
              {slots.map((s) => (
                <button
                  key={s.time}
                  className={`slot ${!s.available ? "booked" : selected === s.time ? "selected" : "available"}`}
                  disabled={!s.available}
                  onClick={() => s.available && setSelected(s.time)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div className="form-group">
            <label className="label">Notes (optional)</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Describe your concern briefly..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {selected && (
          <div
            style={{
              background: "rgba(0,74,198,0.06)",
              borderRadius: "var(--radius-lg)",
              padding: "1rem",
              marginBottom: "1rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ fontWeight: 700 }}>
                Selected: {date} at {selected}
              </div>
              <div
                style={{ fontSize: "0.82rem", color: "var(--on-surface-var)" }}
              >
                Please arrive 10 minutes early
              </div>
            </div>
            <span className="badge badge-info">Confirmed</span>
          </div>
        )}

        <button
          className={`btn btn-primary btn-full btn-lg ${booking ? "btn-loading" : ""}`}
          onClick={book}
          disabled={!selected || booking}
        >
          {!booking && "Confirm Booking →"}
        </button>
      </div>
    </div>
  );
}
