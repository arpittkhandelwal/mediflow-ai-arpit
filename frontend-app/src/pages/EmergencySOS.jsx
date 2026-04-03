import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { emergencyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function EmergencySOS() {
  const navigate = useNavigate();
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState('');

  const activate = async () => {
    setActivating(true);
    try {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          try {
            const res = await emergencyAPI.sos({ latitude, longitude, message });
            toast.success('🚨 SOS Activated! Help is on the way.');
            navigate(`/emergency/track/${res.emergency_id}`);
          } catch(e) {
            toast.error(e.message || 'SOS failed — Call 112!');
          } finally { setActivating(false); }
        },
        async () => {
          // Fallback: no GPS
          try {
            const res = await emergencyAPI.sos({ latitude: 0, longitude: 0, message: message || 'Location unavailable' });
            toast.success('🚨 SOS sent! Location could not be obtained.');
            navigate(`/emergency/track/${res.emergency_id}`);
          } catch(e) { toast.error('SOS failed — Call 112 immediately!'); }
          finally { setActivating(false); }
        },
        { timeout: 8000 }
      );
    } catch(e) { toast.error('SOS activation failed'); setActivating(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#fef2f2,#fff)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <Link to="/dashboard" style={{ position:'fixed', top:'1.5rem', left:'1.5rem', color:'var(--on-surface-var)', fontWeight:600, fontSize:'0.9rem' }}>← Dashboard</Link>

      <div style={{ textAlign:'center', maxWidth:500 }}>
        <div style={{ fontSize:'5rem', marginBottom:'1rem', animation:'pulse-red 2s ease-in-out infinite' }}>🚨</div>
        <h1 style={{ fontSize:'2.5rem', fontWeight:800, color:'#dc2626', marginBottom:'0.5rem' }}>Emergency SOS</h1>
        <p style={{ color:'var(--on-surface-var)', marginBottom:'2rem', lineHeight:1.7 }}>
          Tap the button below to immediately send your location to emergency services. 
          Your doctor and emergency contacts will be notified.
        </p>

        <div className="form-group" style={{ marginBottom:'2rem', textAlign:'left' }}>
          <label className="label">Emergency Message (optional)</label>
          <textarea className="textarea" placeholder="e.g. Severe chest pain, unable to breathe..." rows={3} value={message} onChange={e => setMessage(e.target.value)} />
        </div>

        <button className="emergency-btn" onClick={activate} disabled={activating}>
          {activating ? 'Sending SOS...' : '🚨 ACTIVATE SOS'}
        </button>

        <div style={{ marginTop:'2rem', padding:'1rem', background:'rgba(220,38,38,0.06)', borderRadius:'var(--radius-lg)' }}>
          <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>Emergency Contacts</p>
          <p style={{ fontSize:'0.85rem', color:'var(--on-surface-var)' }}>
            India Emergency: <a href="tel:112" style={{ color:'#dc2626', fontWeight:700 }}>112</a> · 
            Ambulance: <a href="tel:108" style={{ color:'#dc2626', fontWeight:700 }}>108</a>
          </p>
        </div>
      </div>
    </div>
  );
}
