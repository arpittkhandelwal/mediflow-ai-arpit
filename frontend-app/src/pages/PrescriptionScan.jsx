import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ocrAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function PrescriptionScan() {
  const [file,    setFile]   = useState(null);
  const [preview, setPreview] = useState(null);
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = (f) => {
    setFile(f); setResult(null);
    if (f && f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else { setPreview(null); }
  };

  const scan = async () => {
    if (!file) return toast.error('Please upload a prescription image');
    setLoading(true); setResult(null);
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await ocrAPI.scanPrescription(fd);
      setResult(res);
      toast.success('Prescription scanned successfully! 🎉');
    } catch(e) { toast.error(e.message || 'Scan failed'); }
    finally { setLoading(false); }
  };

  const onDrop = (e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if(f) handleFile(f); };

  return (
    <div style={{ minHeight:'100vh', background:'var(--surface)' }}>
      <nav className="nav">
        <Link to="/dashboard" className="nav-brand">← MediFlow AI</Link>
      </nav>
      <div style={{ maxWidth:800, margin:'0 auto', padding:'2rem' }}>
        <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📸</div>
          <h1 style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>Prescription Scanner</h1>
          <p style={{ color:'var(--on-surface-var)' }}>Upload a prescription image — AI extracts medicines and dosage automatically</p>
        </div>

        {/* Upload Zone */}
        <div className={`upload-zone ${dragging ? 'dragover' : ''}`}
          style={{ marginBottom:'1.5rem' }}
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}>
          <input ref={inputRef} type="file" accept="image/*,application/pdf" style={{ display:'none' }} onChange={e => handleFile(e.target.files[0])} />
          {preview ? (
            <img src={preview} alt="Preview" style={{ maxHeight:300, borderRadius:'var(--radius-lg)', maxWidth:'100%' }} />
          ) : (
            <>
              <div style={{ fontSize:'4rem', marginBottom:'1rem' }}>📷</div>
              <p style={{ fontWeight:600, marginBottom:'0.25rem' }}>Drop prescription image here or click to browse</p>
              <p style={{ fontSize:'0.85rem', color:'var(--on-surface-var)' }}>Supports JPG, PNG, PDF · Max 10MB</p>
            </>
          )}
        </div>

        {file && (
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem', alignItems:'center', padding:'0.75rem 1rem', background:'var(--surface-low)', borderRadius:'var(--radius-lg)' }}>
            <span style={{ fontSize:'1.5rem' }}>📄</span>
            <div style={{ flex:1 }}>
              <div style={{ fontWeight:600, fontSize:'0.9rem' }}>{file.name}</div>
              <div style={{ fontSize:'0.78rem', color:'var(--on-surface-var)' }}>{(file.size/1024).toFixed(0)} KB</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => { setFile(null); setPreview(null); setResult(null); }}>✕ Remove</button>
          </div>
        )}

        <button className={`btn btn-primary btn-full btn-lg ${loading?'btn-loading':''}`} onClick={scan} disabled={!file||loading}>
          {!loading && '🔍 Scan Prescription'}
        </button>

        {/* Results */}
        {result && (
          <div className="ai-panel" style={{ marginTop:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <span style={{ fontSize:'1.75rem' }}>✅</span>
              <div>
                <div style={{ fontWeight:700 }}>Scan Complete</div>
                <div style={{ fontSize:'0.78rem', color:'var(--on-surface-var)' }}>OCR Confidence: {result.ocr?.confidence || 'N/A'}%</div>
              </div>
            </div>

            {result.parsed?.patient_name && (
              <div style={{ marginBottom:'1rem' }}>
                <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>👤 Patient</div>
                <div style={{ color:'var(--on-surface-var)' }}>{result.parsed.patient_name}</div>
              </div>
            )}

            <div style={{ marginBottom:'1.25rem' }}>
              <div style={{ fontWeight:700, marginBottom:'0.75rem' }}>💊 Medicines Found</div>
              {result.parsed?.medicines?.length > 0 ? (
                <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                  {result.parsed.medicines.map((m, i) => (
                    <div key={i} style={{ padding:'0.75rem 1rem', background:'var(--surface-low)', borderRadius:'var(--radius-md)', display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                      <span style={{ fontWeight:700 }}>💊 {m.name}</span>
                      {m.dosage    && <span className="badge badge-info">{m.dosage}</span>}
                      {m.frequency && <span className="badge badge-success">{m.frequency}</span>}
                      {m.duration  && <span className="badge badge-warning">{m.duration}</span>}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color:'var(--on-surface-var)', fontSize:'0.875rem' }}>No medicines detected. Please ensure the image is clear.</p>
              )}
            </div>

            {result.parsed?.doctor_notes && (
              <div style={{ padding:'1rem', background:'rgba(0,74,198,0.05)', borderRadius:'var(--radius-lg)' }}>
                <div style={{ fontWeight:600, marginBottom:'0.25rem' }}>📝 Doctor's Notes</div>
                <p style={{ fontSize:'0.875rem' }}>{result.parsed.doctor_notes}</p>
              </div>
            )}

            {result.ocr?.raw_text && (
              <details style={{ marginTop:'1rem' }}>
                <summary style={{ cursor:'pointer', fontSize:'0.85rem', color:'var(--on-surface-var)', fontWeight:600 }}>View raw extracted text</summary>
                <pre style={{ marginTop:'0.5rem', padding:'1rem', background:'var(--surface-low)', borderRadius:'var(--radius-md)', fontSize:'0.8rem', whiteSpace:'pre-wrap', lineHeight:1.6, color:'var(--on-surface-var)' }}>
                  {result.ocr.raw_text}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
