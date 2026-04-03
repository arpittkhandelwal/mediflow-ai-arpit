/**
 * API Service — Axios client connected to MediFlow AI backend
 * Automatically attaches auth token and handles errors globally
 */
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

// ── Request: attach token ──────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mediflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ── Response: handle errors globally ──────────────────────
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg =
      err.response?.data?.error || err.message || "Something went wrong";
    if (err.response?.status === 401) {
      localStorage.removeItem("mediflow_token");
      localStorage.removeItem("mediflow_user");
      window.location.href = "/login";
    }
    return Promise.reject({ message: msg, status: err.response?.status });
  },
);

// ── AUTH ───────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => api.post("/auth/signup", data),
  login: (data) => api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
};

// ── PATIENT ────────────────────────────────────────────────
export const patientAPI = {
  getProfile: () => api.get("/patient/profile"),
  update: (data) => api.post("/patient/update", data),
  getHistory: () => api.get("/patient/history"),
  getReminders: () => api.get("/patient/reminders"),
};

// ── DOCTOR ─────────────────────────────────────────────────
export const doctorAPI = {
  getAll: (params) => api.get("/doctor/all", { params }),
  getProfile: () => api.get("/doctor/profile"),
  update: (data) => api.post("/doctor/update", data),
  getPatients: () => api.get("/doctor/patients"),
  getPatient: (id) => api.get(`/doctor/patient/${id}`),
  createPrescription: (d) => api.post("/doctor/prescription", d),
};

// ── APPOINTMENTS ───────────────────────────────────────────
export const appointmentAPI = {
  book: (data) => api.post("/appointments/book", data),
  getAll: () => api.get("/appointments"),
  updateStatus: (data) => api.patch("/appointments/status", data),
  getSlots: (doctorId, date) =>
    api.get(`/appointments/slots/${doctorId}`, { params: { date } }),
};

// ── PRESCRIPTIONS ──────────────────────────────────────────
export const prescriptionAPI = {
  getMy: () => api.get("/prescriptions/my"),
  getByPatient: (id) => api.get(`/prescriptions/${id}`),
};

// ── REPORTS ────────────────────────────────────────────────
export const reportAPI = {
  upload: (formData) =>
    api.post("/reports/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getMy: () => api.get("/reports/my"),
  getByPatient: (id) => api.get(`/reports/${id}`),
};

// ── EMERGENCY ──────────────────────────────────────────────
export const emergencyAPI = {
  sos: (data) => api.post("/emergency/sos", data),
  resolve: (id) => api.patch(`/emergency/resolve/${id}`),
  history: () => api.get("/emergency/history"),
};

// ── AI ─────────────────────────────────────────────────────
export const aiAPI = {
  checkSymptoms: (data) => api.post("/ai/symptoms", data),
  summary: (data) => api.post("/ai/summary", data),
  chat: (data) => api.post("/ai/chat", data),
};

// ── OCR ────────────────────────────────────────────────────
export const ocrAPI = {
  scanPrescription: (formData) =>
    api.post("/scan-prescription", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
