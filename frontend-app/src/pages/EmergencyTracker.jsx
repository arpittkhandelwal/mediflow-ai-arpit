import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { emergencyAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function EmergencyTracker() {
  const { id } = useParams();
  const [emergency, setEmergency] = useState(null);
  const [resolving, setResolving] = useState(false);
  const [elapsed,   setElapsed]   = useState(0);

  useEffect(() => {
    emergencyAPI.history().then(r => {
      const log = r.emergency_logs?.find(e => e.id === id);
      if (log) setEmergency(log);
    }).catch(() => {});

    const interval = setInterval(() => setElapsed(p => p + 1), 1000);
    return () => clearInterval(interval);
  }, [id]);

  const resolve = async () => {
    setResolving(true);
    try {
      await emergencyAPI.resolve(id);
      toast.success('Emergency resolved. Stay safe! 💚');
      setEmergency(p => p ? {...p, status: 'resolved'} : p);
    } catch(e) { toast.error(e.message || 'Failed to resolve'); }
    finally { setResolving(false); }
  };

  const fmt = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  return (
    <div style={{ minHeight:'100vh', background:'#fef2f2', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ maxWidth:500, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize: emergency?.status === 'resolved' ? '5rem' : '4rem', marginBottom:'1rem',
          ...(emergency?.status !== 'resolved' ? { animation: 'pulse-red 1s ease-in-out infinite' } : {}) }}>
          {emergency?.status === 'resolved' ? '✅' : '🚨'}
        </div>

        <h1 style={{ fontSize:'2rem', color: emergency?.status === 'resolved' ? 'var(--secondary)' : '#dc2626', marginBottom:'0.5rem' }}>
          {emergency?.status === 'resolved' ? 'Emergency Resolved' : 'SOS ACTIVE'}
        </h1>

        {emergency?.status !== 'resolved' && (
          <>
            <div style={{ fontSize:'3rem', fontWeight:800, fontFamily:'var(--font-display)', color:'#dc2626', margin:'1.5rem 0' }}>
              {fmt(elapsed)}
            </div>
            <p style={{ color:'var(--on-surface-var)', marginBottom:'1.5rem' }}>
              Emergency services have been notified. Location shared. Stay calm.
            </p>
          </>
        )}

        {emergency && (
          <div style={{ background:'#fff', borderRadius:'var(--radius-xl)', padding:'1.5rem', marginBottom:'1.5rem', boxShadow:'0 8px 32px rgba(220,38,38,0.1)', textAlign:'left' }}>
            <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
              <span className={`badge ${emergency.status === 'active' ? 'badge-error' : 'badge-success'}`}>
                {emergency.status?.toUpperCase()}
              </span>
            </div>
            {emergency.message && (
              <div style={{ marginBottom:'0.75rem' }}>
                <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--on-surface-var)' }}>Message</div>
                <div>{emergency.message}</div>
              </div>
            )}
            {(emergency.latitude !== 0 || emergency.longitude !== 0) && (
              <div>
                <div style={{ fontWeight:600, fontSize:'0.85rem', color:'var(--on-surface-var)' }}>📍 Location</div>
                <div style={{ fontSize:'0.875rem' }}>{emergency.latitude?.toFixed(4)}, {emergency.longitude?.toFixed(4)}</div>
                <a href={`https://maps.google.com/?q=${emergency.latitude},${emergency.longitude}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ marginTop:'0.5rem', display:'inline-flex' }}>
                  View on Maps →
                </a>
              </div>
            )}
          </div>
        )}

        <div style={{ display:'flex', gap:'0.75rem', justifyContent:'center' }}>
          {emergency?.status === 'active' && (
            <button className={`btn btn-primary ${resolving?'btn-loading':''}`} onClick={resolve} disabled={resolving} style={{ background:'var(--secondary)' }}>
              {!resolving && '✅ Mark as Resolved'}
            </button>
          )}
          <Link to="/dashboard" className="btn btn-secondary">← Dashboard</Link>
          <a href="tel:112" className="btn btn-danger">📞 Call 112</a>
        </div>
      </div>
    </div>
  );
}
