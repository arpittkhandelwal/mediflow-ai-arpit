import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doctorAPI } from "../services/api";
import toast from "react-hot-toast";

const SPECIALIZATIONS = [
  "All",
  "General Physician",
  "Cardiologist",
  "Dermatologist",
  "Pediatrician",
  "Orthopedic",
  "Neurologist",
  "Gynecologist",
  "Psychiatrist",
  "ENT Specialist",
];

export default function FindDoctor() {
  const [doctors, setDoctors] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    doctorAPI
      .getAll()
      .then((r) => {
        setDoctors(r.doctors || []);
        setFiltered(r.doctors || []);
      })
      .catch(() => toast.error("Failed to load doctors"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let d = doctors;
    if (search)
      d = d.filter(
        (doc) =>
          doc.name.toLowerCase().includes(search.toLowerCase()) ||
          doc.specialization?.toLowerCase().includes(search.toLowerCase()),
      );
    if (spec !== "All") d = d.filter((doc) => doc.specialization === spec);
    setFiltered(d);
  }, [search, spec, doctors]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <nav className="nav">
        <Link to="/" className="nav-brand">
          MediFlow AI
        </Link>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/login" className="btn btn-primary btn-sm">
            Login
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        style={{
          background: "linear-gradient(135deg,#004ac6,#2563eb)",
          color: "#fff",
          padding: "3.5rem 2rem",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(1.8rem,4vw,2.8rem)",
            marginBottom: "0.75rem",
          }}
        >
          Find the Right Doctor
        </h1>
        <p style={{ opacity: 0.85, marginBottom: "2rem" }}>
          Browse verified specialists and book instantly
        </p>
        <div style={{ maxWidth: 560, margin: "0 auto", position: "relative" }}>
          <input
            className="input"
            style={{
              paddingLeft: "3rem",
              fontSize: "1rem",
              borderRadius: "var(--radius-full)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
            placeholder="Search by name or specialization..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <span
            style={{
              position: "absolute",
              left: "1rem",
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: "1.2rem",
            }}
          >
            🔍
          </span>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
        {/* Specialization chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.5rem",
            marginBottom: "2rem",
          }}
        >
          {SPECIALIZATIONS.map((s) => (
            <button
              key={s}
              className={`chip ${spec === s ? "active" : ""}`}
              onClick={() => setSpec(s)}
            >
              {s}
            </button>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1.25rem",
          }}
        >
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700 }}>
            {filtered.length} doctors found
          </h2>
        </div>

        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: "1.25rem",
            }}
          >
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="card"
                style={{
                  height: 180,
                  background: "var(--surface-high)",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : (
          <div className="grid-3">
            {filtered.map((d) => (
              <div key={d.id} className="doctor-card">
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    marginBottom: "1rem",
                    alignItems: "center",
                  }}
                >
                  <div className="doctor-avatar">{(d.name || "D")[0]}</div>
                  <div>
                    <div style={{ fontWeight: 700 }}>{d.name}</div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--on-surface-var)",
                      }}
                    >
                      {d.specialization}
                    </div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--on-surface-var)",
                      }}
                    >
                      {d.qualification}
                    </div>
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.82rem",
                    color: "var(--on-surface-var)",
                    marginBottom: "1rem",
                    padding: "0.5rem",
                    background: "var(--surface-low)",
                    borderRadius: "var(--radius-md)",
                  }}
                >
                  <span>⭐ {d.rating}</span>
                  <span>{d.experience} yrs</span>
                  <span>₹{d.consultation_fee}</span>
                  <span
                    className={d.available ? "urgency-low" : "urgency-high"}
                  >
                    {d.available ? "● Available" : "○ Busy"}
                  </span>
                </div>
                <Link
                  to={`/select-slot/${d.id}`}
                  className="btn btn-primary btn-full btn-sm"
                >
                  Book Appointment
                </Link>
              </div>
            ))}
            {!filtered.length && !loading && (
              <div
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "4rem",
                  color: "var(--on-surface-var)",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</div>
                <p>
                  No doctors found. Try a different search term or
                  specialization.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
