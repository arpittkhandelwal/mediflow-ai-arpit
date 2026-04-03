import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function BookingSuccess() {
  const { state } = useLocation();
  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ textAlign:'center', maxWidth:500 }}>
        <div style={{ width:100, height:100, borderRadius:'50%', background:'linear-gradient(135deg,#006e2f,#22c55e)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', margin:'0 auto 1.5rem' }}>✅</div>
        <h1 style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>Appointment Booked!</h1>
        <p style={{ color:'var(--on-surface-var)', marginBottom:'1.5rem', lineHeight:1.7 }}>
          Your appointment has been successfully booked for <strong>{state?.date}</strong> at <strong>{state?.slot_time}</strong>.
          You'll receive a confirmation shortly.
        </p>
        <div style={{ background:'rgba(0,110,47,0.06)', borderRadius:'var(--radius-lg)', padding:'1.25rem', marginBottom:'2rem' }}>
          <div style={{ fontWeight:700, color:'var(--secondary)' }}>📅 {state?.date} · ⏰ {state?.slot_time}</div>
          <div style={{ fontSize:'0.82rem', color:'var(--on-surface-var)', marginTop:'0.25rem' }}>Please arrive 10 minutes early · Bring your documents</div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
          <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
          <Link to="/find-doctor" className="btn btn-secondary">Book Another</Link>
        </div>
      </div>
    </div>
  );
}
