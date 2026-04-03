import React, { useState } from "react";
import { Link } from "react-router-dom";
import { aiAPI } from "../services/api";
import toast from "react-hot-toast";

const URGENCY_COLOR = {
  low: "#006e2f",
  medium: "#d97706",
  high: "#dc2626",
  emergency: "#7c0000",
};

export default function SymptomChecker() {
  const [symptoms, setSymptoms] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Chatbot state
  const [chatMode, setChatMode] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "ai",
      text: "नमस्ते! I am Asha, your AI health assistant. How can I help you today? 🌿",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);

  const analyze = async () => {
    if (!symptoms.trim() || symptoms.length < 10)
      return toast.error(
        "Please describe your symptoms in detail (min 10 chars)",
      );
    setLoading(true);
    setResult(null);
    try {
      const res = await aiAPI.checkSymptoms({
        symptoms,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
      });
      setResult(res.analysis);
    } catch (e) {
      toast.error(e.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput("");
    setMessages((p) => [...p, { role: "user", text: msg }]);
    setChatLoading(true);
    try {
      const res = await aiAPI.chat({
        message: msg,
        conversation_history: chatHistory,
      });
      setMessages((p) => [...p, { role: "ai", text: res.reply }]);
      setChatHistory(res.updated_history || []);
    } catch (e) {
      setMessages((p) => [
        ...p,
        {
          role: "ai",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const commonSymptoms = [
    "Fever & Chills",
    "Headache",
    "Chest Pain",
    "Cough & Cold",
    "Stomach Ache",
    "Back Pain",
    "Dizziness",
    "Fatigue",
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <nav className="nav">
        <Link to="/dashboard" className="nav-brand">
          ← MediFlow AI
        </Link>
        <div className="nav-links">
          <button
            className={`chip ${!chatMode ? "active" : ""}`}
            onClick={() => setChatMode(false)}
          >
            🔍 Symptom Checker
          </button>
          <button
            className={`chip ${chatMode ? "active" : ""}`}
            onClick={() => setChatMode(true)}
          >
            💬 Chat with Asha
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 800, margin: "0 auto", padding: "2rem" }}>
        {!chatMode ? (
          <>
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.75rem" }}>
                🤖
              </div>
              <h1 style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                AI Symptom Checker
              </h1>
              <p style={{ color: "var(--on-surface-var)" }}>
                Describe your symptoms and get instant AI-powered health
                insights
              </p>
            </div>

            <div className="card" style={{ marginBottom: "1.5rem" }}>
              <div className="form-group" style={{ marginBottom: "1rem" }}>
                <label className="label">Describe your symptoms *</label>
                <textarea
                  className="textarea"
                  rows={5}
                  placeholder="e.g. I have had a high fever for 3 days along with body aches and a sore throat..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                />
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--on-surface-var)",
                    textAlign: "right",
                    marginTop: "0.25rem",
                  }}
                >
                  {symptoms.length}/2000
                </div>
              </div>

              <div style={{ marginBottom: "1rem" }}>
                <label
                  className="label"
                  style={{ marginBottom: "0.5rem", display: "block" }}
                >
                  Common symptoms (click to add)
                </label>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {commonSymptoms.map((s) => (
                    <button
                      key={s}
                      className="chip"
                      onClick={() =>
                        setSymptoms((p) =>
                          p ? `${p}, ${s.toLowerCase()}` : s.toLowerCase(),
                        )
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="label">Age (optional)</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="e.g. 32"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    min="0"
                    max="130"
                  />
                </div>
                <div className="form-group">
                  <label className="label">Gender (optional)</label>
                  <select
                    className="select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Prefer not to say</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <button
                className={`btn btn-primary btn-full btn-lg ${loading ? "btn-loading" : ""}`}
                onClick={analyze}
                disabled={loading}
                style={{ marginTop: "1rem" }}
              >
                {!loading && "🔍 Analyze Symptoms"}
              </button>
            </div>

            {result && (
              <div className="ai-panel">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "1.5rem",
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg,var(--primary),var(--secondary))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.3rem",
                    }}
                  >
                    🤖
                  </div>
                  <div>
                    <div style={{ fontWeight: 700 }}>Asha's Analysis</div>
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--on-surface-var)",
                      }}
                    >
                      AI-powered · Not a medical diagnosis
                    </div>
                  </div>
                </div>

                {/* Urgency */}
                <div
                  style={{
                    padding: "1rem",
                    borderRadius: "var(--radius-lg)",
                    marginBottom: "1.5rem",
                    background:
                      result.urgency_level === "emergency"
                        ? "#fef2f2"
                        : result.urgency_level === "high"
                          ? "#fff7f7"
                          : result.urgency_level === "medium"
                            ? "#fffbeb"
                            : "#f0fdf4",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--on-surface-var)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Urgency Level
                  </div>
                  <div
                    style={{
                      fontSize: "1.3rem",
                      fontWeight: 800,
                      color: URGENCY_COLOR[result.urgency_level] || "#171c1f",
                    }}
                  >
                    {result.urgency_level?.toUpperCase() || "UNKNOWN"}
                  </div>
                  <p style={{ fontSize: "0.875rem", marginTop: "0.3rem" }}>
                    {result.urgency_message}
                  </p>
                </div>

                {/* Conditions */}
                {result.possible_conditions?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                      Possible Conditions
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      {result.possible_conditions.map((c, i) => (
                        <span key={i} className="badge badge-warning">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialist */}
                {result.recommended_specialist && (
                  <div
                    style={{
                      marginBottom: "1.25rem",
                      padding: "1rem",
                      borderRadius: "var(--radius-lg)",
                      background: "rgba(0,74,198,0.05)",
                    }}
                  >
                    <div style={{ fontWeight: 700, marginBottom: "0.25rem" }}>
                      👨‍⚕️ Recommended Specialist
                    </div>
                    <div>{result.recommended_specialist}</div>
                  </div>
                )}

                {/* Home care */}
                {result.home_care_tips?.length > 0 && (
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>
                      🏠 Home Care Tips
                    </div>
                    <ul
                      style={{
                        listStyle: "none",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.4rem",
                      }}
                    >
                      {result.home_care_tips.map((t, i) => (
                        <li
                          key={i}
                          style={{
                            fontSize: "0.875rem",
                            display: "flex",
                            gap: "0.5rem",
                          }}
                        >
                          <span>✅</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* When to seek help */}
                {result.when_to_seek_help && (
                  <div
                    style={{
                      marginBottom: "1.25rem",
                      padding: "1rem",
                      borderRadius: "var(--radius-lg)",
                      background: "#fff7f7",
                      borderLeft: "3px solid var(--error)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: "0.25rem",
                        color: "var(--error)",
                      }}
                    >
                      ⚠️ When to Seek Immediate Help
                    </div>
                    <p style={{ fontSize: "0.875rem" }}>
                      {result.when_to_seek_help}
                    </p>
                  </div>
                )}

                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--on-surface-var)",
                    fontStyle: "italic",
                  }}
                >
                  {result.disclaimer}
                </p>

                <div
                  style={{
                    marginTop: "1.5rem",
                    display: "flex",
                    gap: "0.75rem",
                  }}
                >
                  <Link to="/find-doctor" className="btn btn-primary btn-sm">
                    Book a Doctor →
                  </Link>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setResult(null)}
                  >
                    Analyze Again
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ── CHATBOT ─────────────────────────────────── */
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: "1px solid var(--surface-high)",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,var(--primary),var(--secondary))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.2rem",
                }}
              >
                🤖
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>Asha — Health Assistant</div>
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--on-surface-var)",
                  }}
                >
                  ● Online · Powered by Groq AI
                </div>
              </div>
            </div>

            <div
              className="chat-messages"
              style={{
                height: 420,
                overflowY: "auto",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {messages.map((m, i) => (
                <div key={i} className={`chat-msg ${m.role}`}>
                  {m.text}
                </div>
              ))}
              {chatLoading && (
                <div className="chat-msg ai" style={{ opacity: 0.7 }}>
                  Asha is typing
                  <span
                    style={{
                      animation: "spin 1s linear infinite",
                      display: "inline-block",
                      marginLeft: 4,
                    }}
                  >
                    ...
                  </span>
                </div>
              )}
            </div>

            <div className="chat-input-row">
              <input
                className="input chat-input"
                placeholder="Ask Asha anything about your health..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !e.shiftKey && sendChat()
                }
              />
              <button
                className="btn btn-primary"
                onClick={sendChat}
                disabled={chatLoading || !chatInput.trim()}
              >
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
