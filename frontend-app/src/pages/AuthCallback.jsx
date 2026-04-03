import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Handles Supabase Google OAuth callback
export default function AuthCallback() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for AuthContext to pick up the session from URL hash
    const timer = setTimeout(() => {
      if (user)
        navigate(user.role === "doctor" ? "/doctor" : "/dashboard", {
          replace: true,
        });
      else navigate("/login", { replace: true });
    }, 1500);
    return () => clearTimeout(timer);
  }, [user, navigate]);

  return (
    <div
      className="loader-fullscreen"
      style={{ flexDirection: "column", gap: "1rem" }}
    >
      <div className="spinner" />
      <p style={{ color: "var(--on-surface-var)", fontWeight: 500 }}>
        Completing sign-in...
      </p>
    </div>
  );
}
