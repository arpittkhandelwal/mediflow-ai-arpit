import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  patientAPI,
  appointmentAPI,
  prescriptionAPI,
  emergencyAPI,
} from "../services/api";
import toast from "react-hot-toast";

const TABS = [
  "Overview",
  "Appointments",
  "Prescriptions",
  "Reports",
  "Reminders",
];

export default function PatientDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState({
    appointments: [],
    prescriptions: [],
    reports: [],
  });
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      patientAPI
        .getProfile()
        .then((r) => setProfile(r.profile))
        .catch(() => {}),
      patientAPI
        .getHistory()
        .then((r) => setHistory(r))
        .catch(() => {}),
      patientAPI
        .getReminders()
        .then((r) => setReminders(r.reminders || []))
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const statusBadge = (s) => {
    const m = {
      pending: "badge-warning",
      confirmed: "badge-success",
      cancelled: "badge-error",
      completed: "badge-info",
    };
    return <span className={`badge ${m[s] || "badge-info"}`}>{s}</span>;
  };

  if (loading)
    return (
      <div className="loader-fullscreen">
        <div className="spinner" />
      </div>
    );

  const stats = [
    {
      icon: "📅",
      value: history.appointments?.length || 0,
      label: "Appointments",
    },
    {
      icon: "💊",
      value: history.prescriptions?.length || 0,
      label: "Prescriptions",
    },
    { icon: "📄", value: history.reports?.length || 0, label: "Reports" },
    { icon: "⏰", value: reminders.length, label: "Reminders" },
  ];

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">MediFlow AI</div>
        {TABS.map((t) => (
          <button
            key={t}
            className={`sidebar-item ${tab === t ? "active" : ""}`}
            onClick={() => setTab(t)}
          >
            {
              {
                Overview: "🏠",
                Appointments: "📅",
                Prescriptions: "💊",
                Reports: "📄",
                Reminders: "⏰",
              }[t]
            }{" "}
            {t}
          </button>
        ))}
        <div className="sidebar-divider" />
        <Link to="/symptoms" className="sidebar-item">
          🤖 AI Symptom Checker
        </Link>
        <Link to="/scan" className="sidebar-item">
          📸 Prescription Scanner
        </Link>
        <Link to="/find-doctor" className="sidebar-item">
          👨‍⚕️ Find a Doctor
        </Link>
        <Link
          to="/emergency"
          className="sidebar-item"
          style={{ color: "#dc2626" }}
        >
          🚨 Emergency SOS
        </Link>
        <div className="sidebar-divider" />
        <button
          className="sidebar-item"
          onClick={handleLogout}
          style={{ marginTop: "auto", color: "var(--error)" }}
        >
          ↩ Logout
        </button>
      </aside>

      {/* Main */}
      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {tab === "Overview"
                ? `नमस्ते, ${profile?.name || user?.email?.split("@")[0]} 👋`
                : tab}
            </h1>
            {tab === "Overview" && (
              <p className="dashboard-greeting">
                आपका दैनिक स्वास्थ्य विवरण — Your Daily Health Summary
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link to="/find-doctor" className="btn btn-secondary btn-sm">
              Book Appointment
            </Link>
            <Link to="/emergency" className="btn btn-danger btn-sm">
              🚨 SOS
            </Link>
          </div>
        </div>

        {/* ── OVERVIEW ───────────────────────────────────── */}
        {tab === "Overview" && (
          <>
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{ fontSize: "1.4rem" }}>
                    {s.icon}
                  </div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="grid-2" style={{ marginBottom: "1.5rem" }}>
              {/* Recent appointments */}
              <div className="card">
                <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>
                  Recent Appointments
                </h3>
                {history.appointments?.slice(0, 3).map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.65rem 0",
                      borderBottom: "1px solid var(--surface-high)",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        Dr. {a.doctors?.users?.name || "N/A"}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--on-surface-var)",
                        }}
                      >
                        {a.date} · {a.slot_time || ""}
                      </div>
                    </div>
                    {statusBadge(a.status)}
                  </div>
                ))}
                {!history.appointments?.length && (
                  <p
                    style={{
                      color: "var(--on-surface-var)",
                      fontSize: "0.875rem",
                    }}
                  >
                    No appointments yet.
                  </p>
                )}
                <Link
                  to="/find-doctor"
                  className="btn btn-primary btn-full btn-sm"
                  style={{ marginTop: "1rem" }}
                >
                  Book Now
                </Link>
              </div>

              {/* Reminders */}
              <div className="card">
                <h3 style={{ marginBottom: "1rem", fontSize: "1rem" }}>
                  💊 Medicine Reminders
                </h3>
                {reminders.slice(0, 5).map((r, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      gap: "0.75rem",
                      padding: "0.65rem 0",
                      borderBottom: "1px solid var(--surface-high)",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "var(--radius-md)",
                        background: "rgba(0,110,47,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        fontSize: "1.1rem",
                      }}
                    >
                      💊
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                        {r.medicine}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--on-surface-var)",
                        }}
                      >
                        {r.dosage} · {r.frequency}
                      </div>
                    </div>
                  </div>
                ))}
                {!reminders.length && (
                  <p
                    style={{
                      color: "var(--on-surface-var)",
                      fontSize: "0.875rem",
                    }}
                  >
                    No active reminders. Prescriptions will appear here.
                  </p>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="card">
              <h3 style={{ marginBottom: "1.25rem", fontSize: "1rem" }}>
                Quick Actions
              </h3>
              <div
                style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}
              >
                <Link to="/symptoms" className="btn btn-secondary">
                  🤖 Check Symptoms
                </Link>
                <Link to="/scan" className="btn btn-secondary">
                  📸 Scan Prescription
                </Link>
                <Link to="/find-doctor" className="btn btn-secondary">
                  👨‍⚕️ Find Doctor
                </Link>
                <Link to="/emergency" className="btn btn-danger">
                  🚨 Emergency SOS
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── APPOINTMENTS ───────────────────────────────── */}
        {tab === "Appointments" && (
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3>All Appointments</h3>
              <Link to="/find-doctor" className="btn btn-primary btn-sm">
                + Book New
              </Link>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Doctor</th>
                    <th>Specialization</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {history.appointments?.map((a) => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>
                        Dr. {a.doctors?.users?.name || "N/A"}
                      </td>
                      <td>{a.doctors?.specialization || "—"}</td>
                      <td>{a.date}</td>
                      <td>{a.slot_time || "—"}</td>
                      <td>{statusBadge(a.status)}</td>
                      <td>
                        {a.status === "pending" && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={async () => {
                              try {
                                await appointmentAPI.updateStatus({
                                  appointment_id: a.id,
                                  status: "cancelled",
                                });
                                toast.success("Appointment cancelled");
                                const r = await patientAPI.getHistory();
                                setHistory(r);
                              } catch (e) {
                                toast.error(e.message);
                              }
                            }}
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!history.appointments?.length && (
                <p
                  style={{
                    padding: "2rem",
                    color: "var(--on-surface-var)",
                    textAlign: "center",
                  }}
                >
                  No appointments found.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── PRESCRIPTIONS ──────────────────────────────── */}
        {tab === "Prescriptions" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
          >
            {history.prescriptions?.map((p) => (
              <div key={p.id} className="card">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      Dr. {p.doctors?.users?.name || "Unknown"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--on-surface-var)",
                      }}
                    >
                      {p.doctors?.specialization} ·{" "}
                      {new Date(p.created_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <span className="badge badge-info">💊 Prescription</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  {(Array.isArray(p.medicines) ? p.medicines : []).map(
                    (m, i) => (
                      <span key={i} className="chip active">
                        💊 {m.name || m} — {m.dosage || ""}
                      </span>
                    ),
                  )}
                </div>
                {p.notes && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--on-surface-var)",
                      fontStyle: "italic",
                    }}
                  >
                    📝 {p.notes}
                  </p>
                )}
              </div>
            ))}
            {!history.prescriptions?.length && (
              <div
                className="card"
                style={{ textAlign: "center", padding: "3rem" }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>💊</div>
                <p style={{ color: "var(--on-surface-var)" }}>
                  No prescriptions yet. Visit a doctor to get started.
                </p>
                <Link
                  to="/scan"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: "1rem", display: "inline-flex" }}
                >
                  📸 Scan a Prescription
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS ────────────────────────────────────── */}
        {tab === "Reports" && (
          <div className="card">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1.25rem",
              }}
            >
              <h3>Medical Reports</h3>
              <Link to="/scan" className="btn btn-primary btn-sm">
                + Upload Report
              </Link>
            </div>
            <div className="grid-3">
              {history.reports?.map((r) => (
                <a
                  key={r.id}
                  href={r.file_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: "block" }}
                >
                  <div
                    className="card card-sm"
                    style={{ transition: "all 0.2s", cursor: "pointer" }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.boxShadow =
                        "0 8px 24px rgba(0,74,198,0.15)")
                    }
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "")}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      📄
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        marginBottom: "0.25rem",
                      }}
                    >
                      {r.file_name || "Report"}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--on-surface-var)",
                      }}
                    >
                      {r.report_type} ·{" "}
                      {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                </a>
              ))}
              {!history.reports?.length && (
                <div
                  style={{
                    gridColumn: "1/-1",
                    textAlign: "center",
                    padding: "2rem",
                    color: "var(--on-surface-var)",
                  }}
                >
                  No reports uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── REMINDERS ──────────────────────────────────── */}
        {tab === "Reminders" && (
          <div className="grid-3">
            {reminders.map((r, i) => (
              <div key={i} className="card card-sm">
                <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>
                  💊
                </div>
                <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                  {r.medicine}
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--on-surface-var)",
                    marginBottom: "0.75rem",
                  }}
                >
                  {r.dosage} · {r.frequency}
                </div>
                {r.notes && (
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--on-surface-var)",
                      fontStyle: "italic",
                    }}
                  >
                    {r.notes}
                  </p>
                )}
              </div>
            ))}
            {!reminders.length && (
              <div
                className="card"
                style={{
                  gridColumn: "1/-1",
                  textAlign: "center",
                  padding: "3rem",
                  color: "var(--on-surface-var)",
                }}
              >
                No reminders. Get a prescription from a doctor first.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
