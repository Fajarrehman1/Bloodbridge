import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HealthHistory.css';

const HealthHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [activeTab, setActiveTab] = useState('records');
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    date: '',
    bloodPressure: '',
    hemoglobin: '',
    weight: '',
    bloodSugar: '',
    heartRate: '',
    temperature: '',
    note: '',
    donated: false,
    reportName: '',
    reportType: 'Blood Test',
    photo: null,
    photoName: '',
  });

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    const saved = localStorage.getItem(`hh_${user._id}`);
    if (saved) setRecords(JSON.parse(saved));
  }, [user, navigate]);

  const save = (list) => {
    localStorage.setItem(`hh_${user._id}`, JSON.stringify(list));
    setRecords(list);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(f => ({
        ...f,
        photo: ev.target.result,
        photoName: file.name
      }));
      setPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const entry = {
      ...form,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };
    const updated = [entry, ...records];
    save(updated);
    setForm({
      date: '', bloodPressure: '', hemoglobin: '', weight: '',
      bloodSugar: '', heartRate: '', temperature: '', note: '',
      donated: false, reportName: '', reportType: 'Blood Test',
      photo: null, photoName: ''
    });
    setPreview(null);
    setShowForm(false);
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this record?')) return;
    save(records.filter(r => r.id !== id));
  };

  const donations = records.filter(r => r.donated).length;
  const lastDonation = records.find(r => r.donated);
  const withPhotos = records.filter(r => r.photo).length;

  const nextDonation = () => {
    if (!lastDonation) return null;
    const next = new Date(lastDonation.date);
    next.setDate(next.getDate() + 56);
    return next;
  };

  const nextDate = nextDonation();
  const canDonate = nextDate ? new Date() >= nextDate : true;

  const statusColor = (val, type) => {
    if (!val) return '#888';
    const v = parseFloat(val);
    if (type === 'hb') return v >= 12.5 ? '#27ae60' : '#e74c3c';
    if (type === 'bp') {
      const [s] = val.split('/').map(Number);
      return s <= 120 ? '#27ae60' : s <= 140 ? '#f39c12' : '#e74c3c';
    }
    if (type === 'sugar') return v <= 140 ? '#27ae60' : v <= 200 ? '#f39c12' : '#e74c3c';
    if (type === 'hr') return v >= 60 && v <= 100 ? '#27ae60' : '#e74c3c';
    return '#888';
  };

  const reportTypes = [
    'Blood Test', 'Urine Test', 'X-Ray', 'ECG', 'MRI', 'Ultrasound',
    'Blood Pressure', 'Sugar Test', 'COVID Test', 'Other'
  ];

  return (
    <div className="hh-page">
      {/* Navbar */}
      <header className="hh-navbar">
        <div className="hh-nav-inner">
          <a href="/" className="hh-brand">BloodBridge</a>
          <nav className="hh-nav-links">
            <a href="/">Home</a>
            <a href="/requests">Requests</a>
            <a href="/health-reminders">Health</a>
            <a href="/health-history" className="active">History</a>
          </nav>
          <a
            href={
              user?.role === 'donor' ? '/donor/dashboard' :
              user?.role === 'receiver' ? '/receiver/dashboard' :
              '/admin/dashboard'
            }
            className="hh-dash-btn"
          >
            Dashboard
          </a>
        </div>
      </header>

      <div className="hh-container">
        {/* Page Header */}
        <div className="hh-page-head">
          <div>
            <h1 className="hh-title">Health History</h1>
            <p className="hh-sub">
              Track your health records and upload medical reports
            </p>
          </div>
          <button
            className="hh-add-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Add Record'}
          </button>
        </div>

        {/* Stats */}
        <div className="hh-stats">
          <div className="hh-stat">
            <span className="hh-stat-icon">Blood</span>
            <span className="hh-stat-val">{donations}</span>
            <span className="hh-stat-lbl">Donations</span>
          </div>
          <div className="hh-stat">
            <span className="hh-stat-icon">Records</span>
            <span className="hh-stat-val">{records.length}</span>
            <span className="hh-stat-lbl">Records</span>
          </div>
          <div className="hh-stat">
            <span className="hh-stat-icon">Reports</span>
            <span className="hh-stat-val">{withPhotos}</span>
            <span className="hh-stat-lbl">Reports</span>
          </div>
          <div className="hh-stat">
            <span className="hh-stat-icon">Points</span>
            <span className="hh-stat-val">{donations * 10}</span>
            <span className="hh-stat-lbl">Points</span>
          </div>
          <div className={`hh-stat hh-stat-donate ${canDonate ? 'can' : 'wait'}`}>
            <span className="hh-stat-icon">{canDonate ? 'Eligible' : 'Wait'}</span>
            <span className="hh-stat-val">
              {canDonate
                ? 'Eligible Now!'
                : nextDate?.toLocaleDateString()}
            </span>
            <span className="hh-stat-lbl">Next Donation</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="hh-tabs">
          {['records', 'reports', 'calculator'].map(tab => (
            <button
              key={tab}
              className={`hh-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'records' && 'Health Records'}
              {tab === 'reports' && `Medical Reports (${withPhotos})`}
              {tab === 'calculator' && 'Calculator'}
            </button>
          ))}
        </div>

        {/* ADD RECORD FORM */}
        {showForm && (
          <div className="hh-form-card">
            <h3>
              {form.photo ? 'Add Record with Report' : 'Add Health Record'}
            </h3>
            <form onSubmit={handleSubmit} className="hh-form">
              {/* Basic Info */}
              <div className="hh-form-section">
                <h4>Basic Information</h4>
                <div className="hh-form-row">
                  <div className="hh-field">
                    <label>Date *</label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm({...form, date: e.target.value})}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="hh-field">
                    <label>Report Type</label>
                    <select
                      value={form.reportType}
                      onChange={e => setForm({...form, reportType: e.target.value})}
                    >
                      {reportTypes.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="hh-field">
                  <label>Report / Record Name</label>
                  <input
                    placeholder="e.g. Monthly Blood Test"
                    value={form.reportName}
                    onChange={e => setForm({...form, reportName: e.target.value})}
                  />
                </div>
              </div>

              {/* Vitals */}
              <div className="hh-form-section">
                <h4>Health Vitals</h4>
                <div className="hh-form-row">
                  <div className="hh-field">
                    <label>Blood Pressure</label>
                    <input
                      placeholder="120/80 mmHg"
                      value={form.bloodPressure}
                      onChange={e => setForm({...form, bloodPressure: e.target.value})}
                    />
                  </div>
                  <div className="hh-field">
                    <label>Hemoglobin (g/dL)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="14.5"
                      value={form.hemoglobin}
                      onChange={e => setForm({...form, hemoglobin: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hh-form-row">
                  <div className="hh-field">
                    <label>Weight (kg)</label>
                    <input
                      type="number"
                      placeholder="70"
                      value={form.weight}
                      onChange={e => setForm({...form, weight: e.target.value})}
                    />
                  </div>
                  <div className="hh-field">
                    <label>Blood Sugar (mg/dL)</label>
                    <input
                      type="number"
                      placeholder="100"
                      value={form.bloodSugar}
                      onChange={e => setForm({...form, bloodSugar: e.target.value})}
                    />
                  </div>
                </div>
                <div className="hh-form-row">
                  <div className="hh-field">
                    <label>Heart Rate (bpm)</label>
                    <input
                      type="number"
                      placeholder="72"
                      value={form.heartRate}
                      onChange={e => setForm({...form, heartRate: e.target.value})}
                    />
                  </div>
                  <div className="hh-field">
                    <label>Temperature (F)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="98.6"
                      value={form.temperature}
                      onChange={e => setForm({...form, temperature: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Upload */}
              <div className="hh-form-section">
                <h4>Upload Medical Report</h4>
                <div
                  className="hh-upload-area"
                  onClick={() => fileRef.current?.click()}
                >
                  {preview ? (
                    <div className="hh-preview-wrap">
                      <img src={preview} alt="Report" className="hh-preview-img" />
                      <p className="hh-preview-name">{form.photoName}</p>
                      <button
                        type="button"
                        className="hh-remove-photo"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreview(null);
                          setForm(f => ({ ...f, photo: null, photoName: '' }));
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="hh-upload-placeholder">
                      <p>Click to upload report or photo</p>
                      <button type="button" className="hh-upload-btn">
                        Choose File
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="hh-form-section">
                <h4>Notes</h4>
                <div className="hh-field">
                  <textarea
                    placeholder="Doctor notes..."
                    value={form.note}
                    onChange={e => setForm({...form, note: e.target.value})}
                    rows={3}
                  />
                </div>
                <label className="hh-donated-check">
                  <input
                    type="checkbox"
                    checked={form.donated}
                    onChange={e => setForm({...form, donated: e.target.checked})}
                  />
                  <span>I donated blood on this date</span>
                </label>
              </div>

              <div className="hh-form-btns">
                <button type="submit" className="hh-save-btn">
                  Save Record
                </button>
                <button
                  type="button"
                  className="hh-cancel-btn"
                  onClick={() => { setShowForm(false); setPreview(null); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* RECORDS TAB */}
        {activeTab === 'records' && (
          <div className="hh-records">
            {records.length === 0 ? (
              <div className="hh-empty">
                <p>No health records yet</p>
                <button
                  className="hh-save-btn"
                  onClick={() => setShowForm(true)}
                >
                  + Add First Record
                </button>
              </div>
            ) : (
              <div className="hh-records-list">
                {records.map(rec => (
                  <div
                    key={rec.id}
                    className={`hh-record-card ${rec.donated ? 'donated' : ''}`}
                  >
                    <div className="hh-rec-head">
                      <div className="hh-rec-head-left">
                        <div className="hh-rec-type-icon">
                          {rec.reportType === 'Blood Test' && '🩸'}
                          {rec.reportType === 'X-Ray' && '🔬'}
                          {rec.reportType === 'ECG' && '💓'}
                          {rec.reportType === 'MRI' && '🧠'}
                          {rec.reportType === 'Other' && '📋'}
                        </div>
                        <div>
                          <h4 className="hh-rec-name">
                            {rec.reportName || rec.reportType}
                          </h4>
                          <p className="hh-rec-date">
                            {new Date(rec.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="hh-rec-head-right">
                        {rec.donated && <span className="hh-donated-tag">Donated</span>}
                        <button className="hh-view-btn" onClick={() => setViewRecord(rec)}>
                          View
                        </button>
                        <button className="hh-del-btn" onClick={() => handleDelete(rec.id)}>
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="hh-vitals-row">
                      {rec.bloodPressure && (
                        <span className="hh-vital-pill">
                          BP: {rec.bloodPressure}
                        </span>
                      )}
                      {rec.hemoglobin && (
                        <span className="hh-vital-pill">
                          Hb: {rec.hemoglobin} g/dL
                        </span>
                      )}
                      {rec.weight && (
                        <span className="hh-vital-pill">
                          {rec.weight} kg
                        </span>
                      )}
                      {rec.bloodSugar && (
                        <span className="hh-vital-pill">
                          Sugar: {rec.bloodSugar}
                        </span>
                      )}
                      {rec.heartRate && (
                        <span className="hh-vital-pill">
                          {rec.heartRate} bpm
                        </span>
                      )}
                    </div>

                    {rec.photo && (
                      <div className="hh-rec-photo-row">
                        <img
                          src={rec.photo}
                          alt="Report"
                          className="hh-rec-thumb"
                          onClick={() => setViewRecord(rec)}
                        />
                      </div>
                    )}

                    {rec.note && <p className="hh-rec-note">{rec.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="hh-reports">
            {withPhotos === 0 ? (
              <div className="hh-empty">
                <p>No medical reports uploaded yet</p>
              </div>
            ) : (
                          <div className="hh-photo-grid">
                {records.filter(r => r.photo).map(rec => (
                  <div
                    key={rec.id}
                    className="hh-photo-card"
                    onClick={() => setViewRecord(rec)}
                  >
                    <div className="hh-photo-wrap">
                      <img src={rec.photo} alt={rec.reportName} />
                      <div className="hh-photo-overlay">
                        <span>View</span>
                      </div>
                    </div>
                    <div className="hh-photo-info">
                      <p className="hh-photo-title">
                        {rec.reportName || rec.reportType}
                      </p>
                      <p className="hh-photo-date">
                        {new Date(rec.date).toLocaleDateString()}
                      </p>
                      <span className="hh-photo-type">{rec.reportType}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CALCULATOR TAB */}
        {activeTab === 'calculator' && (
          <div className="hh-calc-section">
            <div className="hh-calc-grid">
              {/* Next Donation */}
              <div className="hh-calc-card">
                <h3>Next Donation Date</h3>
                {lastDonation ? (
                  <div>
                    <p className="hh-calc-label">Last Donation:</p>
                    <p className="hh-calc-val">
                      {new Date(lastDonation.date).toLocaleDateString()}
                    </p>
                    <p className="hh-calc-label">Next Eligible:</p>
                    <p className="hh-calc-val">
                      {canDonate ? 'You can donate NOW!' : nextDate?.toLocaleDateString()}
                    </p>
                    <p className="hh-calc-hint">Whole blood: every 56 days</p>
                  </div>
                ) : (
                  <p className="hh-calc-empty">
                    No donation recorded.
                  </p>
                )}
              </div>

              {/* BMI Calculator */}
              <div className="hh-calc-card">
                <h3>BMI Calculator</h3>
                <BmiCalc />
              </div>

              {/* Eligibility */}
              <div className="hh-calc-card">
                <h3>Donation Eligibility</h3>
                <div className="hh-elig-list">
                  {[
                    { label: 'Age 18-65', ok: true },
                    { label: 'Weight above 50 kg', ok: records.some(r => parseFloat(r.weight) >= 50) },
                    { label: 'Hb above 12.5 g/dL', ok: records.some(r => parseFloat(r.hemoglobin) >= 12.5) },
                    { label: 'BP in normal range', ok: records.some(r => r.bloodPressure) },
                    { label: 'No recent donation', ok: canDonate },
                  ].map((item, i) => (
                    <div key={i} className={`hh-elig-row ${item.ok ? 'ok' : 'warn'}`}>
                      <span>{item.ok ? 'OK' : 'Warning'}</span>
                      <span>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW RECORD MODAL */}
      {viewRecord && (
        <div className="hh-modal-overlay" onClick={() => setViewRecord(null)}>
          <div className="hh-modal" onClick={e => e.stopPropagation()}>
            <div className="hh-modal-head">
              <h3>{viewRecord.reportName || viewRecord.reportType}</h3>
              <button className="hh-modal-close" onClick={() => setViewRecord(null)}>
                Close
              </button>
            </div>
            <div className="hh-modal-body">
              {viewRecord.photo && (
                <div className="hh-modal-photo">
                  <img src={viewRecord.photo} alt="Report" />
                  <a
                    href={viewRecord.photo}
                    download={viewRecord.photoName || 'report.jpg'}
                    className="hh-download-btn"
                  >
                    Download Report
                  </a>
                </div>
              )}
              <div className="hh-modal-details">
                <div className="hh-modal-row">
                  <span>Date</span>
                  <span>{new Date(viewRecord.date).toLocaleDateString()}</span>
                </div>
                <div className="hh-modal-row">
                  <span>Type</span>
                  <span>{viewRecord.reportType}</span>
                </div>
                {viewRecord.bloodPressure && (
                  <div className="hh-modal-row">
                    <span>Blood Pressure</span>
                    <span>{viewRecord.bloodPressure} mmHg</span>
                  </div>
                )}
                {viewRecord.hemoglobin && (
                  <div className="hh-modal-row">
                    <span>Hemoglobin</span>
                    <span>{viewRecord.hemoglobin} g/dL</span>
                  </div>
                )}
                {viewRecord.weight && (
                  <div className="hh-modal-row">
                    <span>Weight</span>
                    <span>{viewRecord.weight} kg</span>
                  </div>
                )}
                {viewRecord.bloodSugar && (
                  <div className="hh-modal-row">
                    <span>Blood Sugar</span>
                    <span>{viewRecord.bloodSugar} mg/dL</span>
                  </div>
                )}
                {viewRecord.heartRate && (
                  <div className="hh-modal-row">
                    <span>Heart Rate</span>
                    <span>{viewRecord.heartRate} bpm</span>
                  </div>
                )}
                {viewRecord.temperature && (
                  <div className="hh-modal-row">
                    <span>Temperature</span>
                    <span>{viewRecord.temperature}F</span>
                  </div>
                )}
                {viewRecord.note && (
                  <div className="hh-modal-row">
                    <span>Notes</span>
                    <span>{viewRecord.note}</span>
                  </div>
                )}
                {viewRecord.donated && (
                  <div className="hh-modal-row">
                    <span>Donated</span>
                    <span>Yes - Blood donated on this date</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// BMI Calculator Component
const BmiCalc = () => {
  const [h, setH] = useState('');
  const [w, setW] = useState('');
  const bmi = h && w ? (parseFloat(w) / Math.pow(parseFloat(h) / 100, 2)).toFixed(1) : null;
  const cat = !bmi ? '' :
    bmi < 18.5 ? 'Underweight' :
    bmi < 25 ? 'Normal' :
    bmi < 30 ? 'Overweight' : 'Obese';

  return (
    <div className="hh-bmi">
      <div className="hh-bmi-row">
        <div className="hh-field">
          <label>Height (cm)</label>
          <input
            type="number"
            placeholder="170"
            value={h}
            onChange={e => setH(e.target.value)}
          />
        </div>
        <div className="hh-field">
          <label>Weight (kg)</label>
          <input
            type="number"
            placeholder="70"
            value={w}
            onChange={e => setW(e.target.value)}
          />
        </div>
      </div>
      {bmi && (
        <div className="hh-bmi-result">
          <span className="hh-bmi-val">{bmi}</span>
          <span className="hh-bmi-cat">{cat}</span>
        </div>
      )}
    </div>
  );
};

export default HealthHistory;