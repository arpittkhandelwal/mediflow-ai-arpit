import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signInWithGoogle } from "../services/supabase";
import toast from "react-hot-toast";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login"); // 'login' | 'signup'
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "patient",
  });

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const res = await login(form.email, form.password);
        toast.success(`Welcome back, ${res.user.name}! 👋`);
        navigate(res.user.role === "doctor" ? "/doctor" : "/dashboard");
      } else {
        await signup({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        toast.success("Account created! Welcome to MediFlow AI 🎉");
        navigate(form.role === "doctor" ? "/doctor" : "/dashboard");
      }
    } catch (err) {
      toast.error(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (err) {
      toast.error(err.message || "Google sign-in failed");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f6fafe 0%, #eaf1ff 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <Link
            to="/"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.8rem",
              fontWeight: 800,
              background: "linear-gradient(135deg,#004ac6,#2563eb)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            MediFlow AI
          </Link>
          <p
            style={{
              color: "var(--on-surface-var)",
              marginTop: "0.3rem",
              fontSize: "0.9rem",
            }}
          >
            {mode === "login" ? "Welcome back 🙏" : "Start your health journey"}
          </p>
        </div>

        <div
          className="card"
          style={{ boxShadow: "0 20px 60px rgba(0,74,198,0.1)" }}
        >
          {/* Tab */}
          <div
            style={{
              display: "flex",
              background: "var(--surface-low)",
              borderRadius: "var(--radius-full)",
              padding: "4px",
              marginBottom: "1.75rem",
            }}
          >
            {["login", "signup"].map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  flex: 1,
                  padding: "0.5rem",
                  borderRadius: "var(--radius-full)",
                  border: "none",
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  background: mode === m ? "#fff" : "transparent",
                  color:
                    mode === m ? "var(--primary)" : "var(--on-surface-var)",
                  boxShadow: mode === m ? "var(--shadow-card)" : "none",
                }}
              >
                {m === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {mode === "signup" && (
              <div className="form-group">
                <label className="label">Full Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="Dr. Arjun Sharma"
                  value={form.name}
                  onChange={set("name")}
                  required
                />
              </div>
            )}
            <div className="form-group">
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={set("email")}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder={
                  mode === "signup"
                    ? "Min 8 chars, uppercase + number"
                    : "••••••••"
                }
                value={form.password}
                onChange={set("password")}
                required
              />
            </div>
            {mode === "signup" && (
              <div className="form-group">
                <label className="label">I am a</label>
                <div style={{ display: "flex", gap: "0.75rem" }}>
                  {["patient", "doctor"].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, role: r }))}
                      style={{
                        flex: 1,
                        padding: "0.65rem",
                        border: `2px solid ${form.role === r ? "var(--primary)" : "var(--outline-var)"}`,
                        borderRadius: "var(--radius-md)",
                        background:
                          form.role === r ? "rgba(0,74,198,0.06)" : "#fff",
                        color:
                          form.role === r
                            ? "var(--primary)"
                            : "var(--on-surface-var)",
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: "0.9rem",
                        transition: "all 0.15s",
                      }}
                    >
                      {r === "patient" ? "🏥 Patient" : "👨‍⚕️ Doctor"}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button
              type="submit"
              className={`btn btn-primary btn-full btn-lg ${loading ? "btn-loading" : ""}`}
              disabled={loading}
            >
              {!loading && (mode === "login" ? "Log In" : "Create Account")}
            </button>
          </form>

          <div className="or-divider" style={{ margin: "1.25rem 0" }}>
            or
          </div>

          <button
            className="btn btn-google btn-full"
            onClick={handleGoogle}
            style={{ gap: "0.75rem" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        <p
          style={{
            textAlign: "center",
            marginTop: "1.25rem",
            color: "var(--on-surface-var)",
            fontSize: "0.8rem",
          }}
        >
          By continuing, you agree to MediFlow AI's Terms of Service
        </p>
      </div>
    </div>
  );
}
