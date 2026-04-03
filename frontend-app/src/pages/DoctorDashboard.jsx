import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doctorAPI, appointmentAPI } from '../services/api';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Patients', 'Appointments', 'Write Prescription'];

export default function DoctorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab,      setTab]      = useState('Overview');
  const [profile,  setProfile]  = useState(null);
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Prescription form
  const [rxForm, setRxForm] = useState({ patient_id: '', notes: '', medicines: [{ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }] });

  useEffect(() => {
    Promise.all([
      doctorAPI.getProfile().then(r => setProfile(r.profile)).catch(() => {}),
      doctorAPI.getPatients().then(r => setPatients(r.patients || [])).catch(() => {}),
      appointmentAPI.getAll().then(r => setAppointments(r.appointments || [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const updateStatus = async (id, status) => {
    try {
      await appointmentAPI.updateStatus({ appointment_id: id, status });
      toast.success(`Appointment ${status}`);
      const r = await appointmentAPI.getAll(); setAppointments(r.appointments || []);
    } catch(e) { toast.error(e.message); }
  };

  const addMed = () => setRxForm(p => ({ ...p, medicines: [...p.medicines, { name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }] }));
  const setMed = (i, k, v) => setRxForm(p => { const m=[...p.medicines]; m[i]={...m[i],[k]:v}; return {...p,medicines:m}; });
  const removeMed = (i) => setRxForm(p => ({ ...p, medicines: p.medicines.filter((_,idx) => idx !== i) }));

  const submitPrescription = async () => {
    if (!rxForm.patient_id) return toast.error('Select a patient');
    if (!rxForm.medicines[0].name) return toast.error('Add at least one medicine');
    try {
      await doctorAPI.createPrescription({ patient_id: rxForm.patient_id, medicines: rxForm.medicines, notes: rxForm.notes });
      toast.success('Prescription created successfully! 💊');
      setRxForm({ patient_id: '', notes: '', medicines: [{ name: '', dosage: '', frequency: 'Once daily', duration: '7 days' }] });
      setTab('Overview');
    } catch(e) { toast.error(e.message || 'Failed to create prescription'); }
  };

  if (loading) return <div className="loader-fullscreen"><div className="spinner" /></div>;

  const pending   = appointments.filter(a => a.status === 'pending').length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;

  const statusBadge = (s) => {
    const m = { pending:'badge-warning', confirmed:'badge-success', cancelled:'badge-error', completed:'badge-info' };
    return <span className={`badge ${m[s]||'badge-info'}`}>{s}</span>;
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">MediFlow AI</div>
        <div style={{ padding: '0 0.75rem 1rem', fontSize: '0.8rem', color: 'var(--on-surface-var)' }}>👨‍⚕️ Doctor Portal</div>
        {TABS.map(t => (
          <button key={t} className={`sidebar-item ${tab===t?'active':''}`} onClick={() => setTab(t)}>
            {({Overview:'🏠',Patients:'👥',Appointments:'📅','Write Prescription':'✍️'})[t]} {t}
          </button>
        ))}
        <div className="sidebar-divider" />
        <button className="sidebar-item" onClick={handleLogout} style={{ marginTop: 'auto', color: 'var(--error)' }}>↩ Logout</button>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div>
            <h1 className="dashboard-title">
              {tab === 'Overview' ? `Dr. ${profile?.name || user?.email} 👋` : tab}
            </h1>
            {tab === 'Overview' && <p className="dashboard-greeting">{profile?.doctor_details?.specialization || 'General Physician'} · {pending} pending appointments</p>}
          </div>
        </div>

        {/* ── OVERVIEW ─────────────────────────────────── */}
        {tab === 'Overview' && (
          <>
            <div className="stats-grid">
              {[
                { icon: '👥', value: patients.length, label: 'Total Patients' },
                { icon: '📅', value: appointments.length, label: 'Appointments' },
                { icon: '⏳', value: pending, label: 'Pending' },
                { icon: '✅', value: confirmed, label: 'Confirmed' },
              ].map((s,i) => (
                <div key={i} className="stat-card">
                  <div className="stat-icon" style={{ fontSize: '1.4rem' }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3>Today's Appointments</h3>
                <button className="btn btn-primary btn-sm" onClick={() => setTab('Write Prescription')}>✍️ Write Prescription</button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {appointments.slice(0,8).map(a => (
                      <tr key={a.id}>
                        <td style={{ fontWeight: 600 }}>{a.patients?.users?.name || 'Patient'}</td>
                        <td>{a.date}</td>
                        <td>{a.slot_time || '—'}</td>
                        <td>{statusBadge(a.status)}</td>
                        <td style={{ display: 'flex', gap: '0.4rem' }}>
                          {a.status === 'pending' && <>
                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'confirmed')}>Confirm</button>
                            <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(a.id, 'cancelled')}>Cancel</button>
                          </>}
                          {a.status === 'confirmed' && (
                            <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(a.id, 'completed')}>Complete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!appointments.length && <p style={{ padding:'2rem', textAlign:'center', color:'var(--on-surface-var)' }}>No appointments yet.</p>}
              </div>
            </div>
          </>
        )}

        {/* ── PATIENTS ─────────────────────────────────── */}
        {tab === 'Patients' && (
          <div className="grid-3">
            {patients.map(p => (
              <div key={p.id} className="card" style={{ transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.boxShadow='0 8px 30px rgba(0,74,198,0.12)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow=''}>
                <div className="doctor-avatar" style={{ marginBottom: '0.75rem', width:48, height:48, fontSize:'1.2rem' }}>{(p.name||'P')[0]}</div>
                <div style={{ fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--on-surface-var)', marginBottom: '0.75rem' }}>
                  {p.age ? `${p.age}y` : ''} {p.gender ? `· ${p.gender}` : ''} · {p.email}
                </div>
                <button className="btn btn-primary btn-sm btn-full" onClick={() => setRxForm(f => ({ ...f, patient_id: p.id })) || setTab('Write Prescription')}>
                  ✍️ Write Prescription
                </button>
              </div>
            ))}
            {!patients.length && <div className="card" style={{ gridColumn:'1/-1', padding:'3rem', textAlign:'center', color:'var(--on-surface-var)' }}>No patients yet — appointments will list them here.</div>}
          </div>
        )}

        {/* ── APPOINTMENTS ─────────────────────────────── */}
        {tab === 'Appointments' && (
          <div className="card">
            <h3 style={{ marginBottom: '1.25rem' }}>All Appointments</h3>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Patient</th><th>Date</th><th>Time</th><th>Notes</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {appointments.map(a => (
                    <tr key={a.id}>
                      <td style={{ fontWeight: 600 }}>{a.patients?.users?.name || 'Patient'}</td>
                      <td>{a.date}</td>
                      <td>{a.slot_time || '—'}</td>
                      <td style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.notes || '—'}</td>
                      <td>{statusBadge(a.status)}</td>
                      <td style={{ display: 'flex', gap: '0.4rem' }}>
                        {a.status === 'pending'   && <><button className="btn btn-sm btn-primary"   onClick={() => updateStatus(a.id,'confirmed')}>Confirm</button><button className="btn btn-sm btn-secondary" onClick={() => updateStatus(a.id,'cancelled')}>Cancel</button></>}
                        {a.status === 'confirmed' && <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(a.id,'completed')}>Complete</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── WRITE PRESCRIPTION ───────────────────────── */}
        {tab === 'Write Prescription' && (
          <div className="card" style={{ maxWidth: 700 }}>
            <h3 style={{ marginBottom: '1.5rem' }}>✍️ Write Prescription</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="label">Select Patient *</label>
              <select className="select" value={rxForm.patient_id} onChange={e => setRxForm(p => ({...p, patient_id: e.target.value}))}>
                <option value="">Choose patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} ({p.email})</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="label">Medicines *</label>
                <button className="btn btn-secondary btn-sm" onClick={addMed}>+ Add Medicine</button>
              </div>
              {rxForm.medicines.map((m, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'end' }}>
                  <input className="input" placeholder="Medicine name" value={m.name} onChange={e => setMed(i,'name',e.target.value)} />
                  <input className="input" placeholder="Dosage (500mg)" value={m.dosage} onChange={e => setMed(i,'dosage',e.target.value)} />
                  <select className="select" value={m.frequency} onChange={e => setMed(i,'frequency',e.target.value)}>
                    <option>Once daily</option><option>Twice daily</option><option>Thrice daily</option><option>SOS</option>
                  </select>
                  <input className="input" placeholder="7 days" value={m.duration} onChange={e => setMed(i,'duration',e.target.value)} />
                  {rxForm.medicines.length > 1 && <button className="btn btn-danger btn-sm" onClick={() => removeMed(i)}>✕</button>}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="label">Doctor's Notes</label>
              <textarea className="textarea" placeholder="e.g. Take medicines after food. Follow up in 7 days." value={rxForm.notes} onChange={e => setRxForm(p => ({...p, notes: e.target.value}))} rows={3} />
            </div>

            <button className="btn btn-primary btn-lg btn-full" onClick={submitPrescription}>💊 Create Prescription</button>
          </div>
        )}
      </main>
    </div>
  );
}
