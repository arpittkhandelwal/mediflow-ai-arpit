import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { doctorAPI } from "../services/api";

const features = [
  {
    icon: "🤖",
    title: "AI Symptom Checker",
    desc: "Describe your symptoms — our AI powered by Groq gives instant insights and specialist recommendations.",
  },
  {
    icon: "👨‍⚕️",
    title: "Find a Doctor",
    desc: "Browse verified specialists, read ratings, and book appointments in seconds.",
  },
  {
    icon: "📸",
    title: "Prescription Scanner",
    desc: "Snap your prescription — AI extracts medicines and dosage automatically via OCR.",
  },
  {
    icon: "🚨",
    title: "Emergency SOS",
    desc: "One-tap SOS sends your location to emergency services instantly.",
  },
  {
    icon: "📋",
    title: "Medical Records",
    desc: "Upload and manage all your reports, prescriptions, and health history in one place.",
  },
  {
    icon: "💊",
    title: "Medicine Reminders",
    desc: "Never miss a dose. Smart reminders based on your prescriptions.",
  },
];

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [demoDoctors, setDemoDocotrs] = useState([]);

  useEffect(() => {
    doctorAPI
      .getAll()
      .then((r) => setDemoDocotrs((r.doctors || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  return (
    <div>
      {/* ── NAV ─────────────────────────────────────────── */}
      <nav className="nav">
        <span className="nav-brand">MediFlow AI</span>
        <div className="nav-links">
          <Link className="nav-link" to="/find-doctor">
            Find Doctors
          </Link>
          <Link className="nav-link" to="/symptoms">
            Symptom Check
          </Link>
          {user ? (
            <Link
              className="btn btn-primary btn-sm"
              to={user.role === "doctor" ? "/doctor" : "/dashboard"}
            >
              My Dashboard
            </Link>
          ) : (
            <>
              <Link className="nav-link" to="/login">
                Log In
              </Link>
              <Link className="btn btn-primary btn-sm" to="/login">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────── */}
      <section
        style={{
          background:
            "linear-gradient(135deg, #004ac6 0%, #2563eb 60%, #1d4ed8 100%)",
          color: "#fff",
          padding: "6rem 2rem 5rem",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(107,255,143,0.08) 0%, transparent 50%)",
          }}
        />
        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(10px)",
              borderRadius: "9999px",
              padding: "0.4rem 1rem",
              fontSize: "0.8rem",
              fontWeight: 600,
              marginBottom: "1.5rem",
            }}
          >
            ✨ Powered by Groq AI &nbsp;•&nbsp; Supabase
          </div>
          <h1
            style={{
              fontSize: "clamp(2.2rem, 5vw, 3.5rem)",
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: "1.25rem",
            }}
          >
            India का Smart
            <br />
            Healthcare Platform
          </h1>
          <p
            style={{
              fontSize: "1.1rem",
              opacity: 0.85,
              marginBottom: "2.5rem",
              lineHeight: 1.7,
            }}
          >
            AI-powered symptom analysis, instant doctor booking, prescription
            scanning, and emergency SOS — all in one platform.{" "}
            <em>आपका स्वास्थ्य, हमारी प्राथमिकता।</em>
          </p>
          <div
            style={{
              display: "flex",
              gap: "1rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              className="btn btn-lg"
              style={{
                background: "#fff",
                color: "var(--primary)",
                fontWeight: 700,
              }}
              to="/login"
            >
              Get Started Free →
            </Link>
            <Link
              className="btn btn-lg"
              style={{
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                backdropFilter: "blur(10px)",
              }}
              to="/find-doctor"
            >
              Find a Doctor
            </Link>
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────── */}
      <section className="section">
        <h2 className="section-title" style={{ textAlign: "center" }}>
          Everything you need for better health
        </h2>
        <p className="section-sub" style={{ textAlign: "center" }}>
          AI-first, privacy-first healthcare for patients and doctors
        </p>
        <div className="grid-3">
          {features.map((f, i) => (
            <div
              key={i}
              className="card"
              style={{
                transition: "transform 0.2s, box-shadow 0.2s",
                cursor: "default",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow =
                  "0 12px 40px rgba(0,74,198,0.12)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: "1.05rem", marginBottom: "0.5rem" }}>
                {f.title}
              </h3>
              <p
                style={{
                  fontSize: "0.875rem",
                  color: "var(--on-surface-var)",
                  lineHeight: 1.6,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DOCTORS TEASER ──────────────────────────────── */}
      {demoDoctors.length > 0 && (
        <section
          style={{ background: "var(--surface-low)", padding: "4rem 2rem" }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <h2
              className="section-title"
              style={{ textAlign: "center", marginBottom: "0.5rem" }}
            >
              Meet Our Doctors
            </h2>
            <p className="section-sub" style={{ textAlign: "center" }}>
              Verified specialists ready to help
            </p>
            <div className="grid-3">
              {demoDoctors.map((d) => (
                <div key={d.id} className="doctor-card">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <div className="doctor-avatar">{(d.name || "D")[0]}</div>
                    <div>
                      <div style={{ fontWeight: 700 }}>{d.name}</div>
                      <div
                        style={{
                          fontSize: "0.82rem",
                          color: "var(--on-surface-var)",
                        }}
                      >
                        {d.specialization}
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
                    }}
                  >
                    <span>⭐ {d.rating}</span>
                    <span>{d.experience} yrs exp</span>
                    <span>₹{d.consultation_fee}</span>
                  </div>
                  <Link
                    to={`/select-slot/${d.id}`}
                    className="btn btn-primary btn-full btn-sm"
                  >
                    Book Appointment
                  </Link>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center", marginTop: "2rem" }}>
              <Link to="/find-doctor" className="btn btn-outline">
                View All Doctors →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ─────────────────────────────────────────── */}
      <section
        style={{
          background: "linear-gradient(135deg,#004ac6,#2563eb)",
          color: "#fff",
          padding: "5rem 2rem",
          textAlign: "center",
        }}
      >
        <h2
          style={{ fontSize: "2.2rem", fontWeight: 800, marginBottom: "1rem" }}
        >
          Ready to take control of your health?
        </h2>
        <p style={{ opacity: 0.85, marginBottom: "2rem", fontSize: "1rem" }}>
          Join thousands of patients and doctors on MediFlow AI
        </p>
        <Link
          to="/login"
          className="btn btn-lg"
          style={{
            background: "#fff",
            color: "var(--primary)",
            fontWeight: 700,
          }}
        >
          Get Started — It's Free
        </Link>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer
        style={{
          background: "var(--on-surface)",
          color: "rgba(255,255,255,0.7)",
          padding: "2rem",
          textAlign: "center",
          fontSize: "0.85rem",
        }}
      >
        © 2024 MediFlow AI · Built with ❤️ for Indian Healthcare ·{" "}
        <a href="#" style={{ color: "rgba(255,255,255,0.7)" }}>
          Privacy
        </a>{" "}
        ·{" "}
        <a href="#" style={{ color: "rgba(255,255,255,0.7)" }}>
          Terms
        </a>
      </footer>
    </div>
  );
}
