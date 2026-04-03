import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LandingPage       from './pages/LandingPage';
import LoginPage         from './pages/LoginPage';
import PatientDashboard  from './pages/PatientDashboard';
import DoctorDashboard   from './pages/DoctorDashboard';
import SymptomChecker    from './pages/SymptomChecker';
import PrescriptionScan  from './pages/PrescriptionScan';
import FindDoctor        from './pages/FindDoctor';
import SelectSlot        from './pages/SelectSlot';
import BookingSuccess    from './pages/BookingSuccess';
import EmergencySOS      from './pages/EmergencySOS';
import EmergencyTracker  from './pages/EmergencyTracker';
import AuthCallback      from './pages/AuthCallback';

// Protected route
const Protected = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-fullscreen"><div className="spinner" /></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (role && user.role && user.role !== role) return <Navigate to="/" replace />;
  return children;
};

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loader-fullscreen"><div className="spinner" /></div>;

  return (
    <Routes>
      {/* Public */}
      <Route path="/"             element={<LandingPage />} />
      <Route path="/login"        element={user ? <Navigate to={user.role === 'doctor' ? '/doctor' : '/dashboard'} /> : <LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/find-doctor"  element={<FindDoctor />} />

      {/* Patient only */}
      <Route path="/dashboard"    element={<Protected><PatientDashboard /></Protected>} />
      <Route path="/symptoms"     element={<Protected><SymptomChecker /></Protected>} />
      <Route path="/scan"         element={<Protected><PrescriptionScan /></Protected>} />
      <Route path="/select-slot/:doctorId" element={<Protected><SelectSlot /></Protected>} />
      <Route path="/booking-success"       element={<Protected><BookingSuccess /></Protected>} />
      <Route path="/emergency"    element={<Protected><EmergencySOS /></Protected>} />
      <Route path="/emergency/track/:id"  element={<Protected><EmergencyTracker /></Protected>} />

      {/* Doctor only */}
      <Route path="/doctor"       element={<Protected role="doctor"><DoctorDashboard /></Protected>} />

      <Route path="*"             element={<Navigate to="/" />} />
    </Routes>
  );
}
