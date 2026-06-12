import { useState, useRef, useEffect } from 'react';
import { useNavigate }                  from 'react-router-dom';
import { useAuth }                      from '../context/AuthContext';
import jsPDF                            from 'jspdf';
import html2canvas                      from 'html2canvas';
import './Certificate.css';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';

const Certificate = () => {
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const certRef     = useRef(null);

  const [donations,   setDonations]   = useState([]);
  const [selected,    setSelected]    = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [generating,  setGenerating]  = useState(false);
  const [preview,     setPreview]     = useState(false);

  const token = JSON.parse(
    localStorage.getItem('bloodbridge_user')
  )?.token;

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'donor') { navigate('/'); return; }
    loadDonations();
  }, [user]);

  const loadDonations = async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${BACKEND}/api/responses/my-responses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const accepted = (data.responses || []).filter(
        r => r.status === 'accepted'
      );
      setDonations(accepted);
      if (accepted.length > 0) setSelected(accepted[0]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const generatePDF = async () => {
    if (!certRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale:           3,
        useCORS:         true,
        backgroundColor: '#ffffff',
        logging:         false
      });

      const imgData  = canvas.toDataURL('image/png');
      const pdf      = new jsPDF({
        orientation: 'landscape',
        unit:        'mm',
        format:      'a4'
      });

      const pdfW  = pdf.internal.pageSize.getWidth();
      const pdfH  = pdf.internal.pageSize.getHeight();
      const ratio = canvas.height / canvas.width;
      const imgW  = pdfW;
      const imgH  = imgW * ratio;
      const yOff  = (pdfH - imgH) / 2;

      pdf.addImage(imgData, 'PNG', 0, yOff, imgW, imgH);

      const donorName  = user?.name?.replace(/\s+/g, '_') || 'Donor';
      const dateStr    = selected
        ? new Date(selected.createdAt).toLocaleDateString('en-PK').replace(/\//g, '-')
        : 'Certificate';

      pdf.save(`BloodBridge_Certificate_${donorName}_${dateStr}.pdf`);
    } catch (err) {
      console.error('PDF generation error:', err);
    }
    setGenerating(false);
  };

  const getDonationNumber = () => {
    if (!selected || !donations.length) return 1;
    const idx = donations.findIndex(d => d._id === selected._id);
    return donations.length - idx;
  };

  const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-PK', {
      day: 'numeric', month: 'long', year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="cert-loading">
        <div className="cert-spinner"></div>
        <p>Loading your donation records...</p>
      </div>
    );
  }

  return (
    <div className="cert-page">

      {/* Navbar */}
      <header className="cert-navbar">
        <div className="cert-nav-inner">
          <a href="/" className="cert-brand">🩸 BloodBridge</a>
          <div className="cert-nav-right">
            <button
              className="cert-back-btn"
              onClick={() => navigate('/donor/dashboard')}
            >
              ← Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="cert-container">
        <div className="cert-page-head">
          <div>
            <h1 className="cert-title">🏆 Donation Certificates</h1>
            <p className="cert-sub">
              Download official certificates for your blood donations
            </p>
          </div>
        </div>

        {donations.length === 0 ? (
          <div className="cert-empty">
            <div className="cert-empty-icon">🏆</div>
            <h3>No completed donations yet</h3>
            <p>
              Your certificate will appear here after a receiver
              accepts your donation response.
            </p>
            <button
              className="cert-find-btn"
              onClick={() => navigate('/requests')}
            >
              Find Blood Requests
            </button>
          </div>
        ) : (
          <div className="cert-layout">

            {/* LEFT — Donation List */}
            <div className="cert-sidebar">
              <h3 className="cert-sidebar-title">
                Select Donation ({donations.length})
              </h3>
              <div className="cert-donation-list">
                {donations.map((don, i) => (
                  <div
                    key={don._id}
                    className={`cert-donation-item ${selected?._id === don._id ? 'active' : ''}`}
                    onClick={() => setSelected(don)}
                  >
                    <div
                      className="cert-item-blood"
                      style={{
                        background:
                          don.request?.bloodGroup === 'O+' ? '#27ae60' :
                          don.request?.bloodGroup === 'O-' ? '#1e8449' :
                          don.request?.bloodGroup?.startsWith('A') ? '#e74c3c' :
                          don.request?.bloodGroup?.startsWith('B') ? '#e67e22' :
                          '#8e44ad'
                      }}
                    >
                      {don.request?.bloodGroup || user?.bloodGroup}
                    </div>
                    <div className="cert-item-info">
                      <p className="cert-item-city">
                        📍 {don.request?.city || 'Unknown'}
                      </p>
                      <p className="cert-item-date">
                        {formatDate(don.createdAt)}
                      </p>
                    </div>
                    <span className="cert-item-num">#{donations.length - i}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Certificate Preview + Actions */}
            <div className="cert-main">

              {/* Action Buttons */}
              <div className="cert-actions">
                <button
                  className="cert-preview-btn"
                  onClick={() => setPreview(!preview)}
                >
                  {preview ? '🙈 Hide Preview' : '👁️ Show Preview'}
                </button>
                <button
                  className="cert-download-btn"
                  onClick={generatePDF}
                  disabled={generating}
                >
                  {generating ? '⏳ Generating...' : '⬇️ Download PDF'}
                </button>
              </div>

              {/* Certificate Design */}
              <div className={`cert-preview-wrap ${preview ? 'visible' : ''}`}>
                <div className="cert-doc" ref={certRef}>

                  {/* Outer border */}
                  <div className="cert-outer-border">
                    <div className="cert-inner-border">

                      {/* Header */}
                      <div className="cert-header">
                        <div className="cert-logo-area">
                          <div className="cert-logo-circle">🩸</div>
                          <div>
                            <div className="cert-org-name">BloodBridge</div>
                            <div className="cert-org-sub">
                              Blood Donation Network Pakistan
                            </div>
                          </div>
                        </div>
                        <div className="cert-header-right">
                          <div className="cert-cert-no">
                            CERT #{String(getDonationNumber()).padStart(4, '0')}
                          </div>
                          <div className="cert-issue-date">
                            Issued: {formatDate(selected?.createdAt)}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="cert-divider">
                        <div className="cert-divider-dot"></div>
                        <div className="cert-divider-line"></div>
                        <div className="cert-divider-dot"></div>
                      </div>

                      {/* Title */}
                      <div className="cert-title-area">
                        <div className="cert-cert-title">
                          Certificate of Appreciation
                        </div>
                        <div className="cert-cert-subtitle">
                          Blood Donation Achievement
                        </div>
                      </div>

                      {/* Main text */}
                      <div className="cert-body-text">
                        <p className="cert-presented-to">This certificate is proudly presented to</p>
                        <div className="cert-recipient-name">{user?.name}</div>
                        <p className="cert-desc">
                          In recognition of your extraordinary act of humanity and compassion
                          in donating <strong>{selected?.request?.bloodGroup || user?.bloodGroup}</strong> blood
                          {selected?.request?.city
                            ? ` to a patient in ${selected.request.city}`
                            : ''},
                          thereby contributing to the gift of life. Your selfless donation
                          may have saved up to <strong>3 lives</strong>.
                        </p>
                      </div>

                      {/* Details */}
                      <div className="cert-details-row">
                        <div className="cert-detail-box">
                          <div className="cert-detail-icon">🩸</div>
                          <div className="cert-detail-label">Blood Group</div>
                          <div className="cert-detail-val">
                            {selected?.request?.bloodGroup || user?.bloodGroup}
                          </div>
                        </div>
                        <div className="cert-detail-box">
                          <div className="cert-detail-icon">📍</div>
                          <div className="cert-detail-label">City</div>
                          <div className="cert-detail-val">
                            {selected?.request?.city || user?.city || 'Pakistan'}
                          </div>
                        </div>
                        <div className="cert-detail-box">
                          <div className="cert-detail-icon">📅</div>
                          <div className="cert-detail-label">Donation Date</div>
                          <div className="cert-detail-val">
                            {formatDate(selected?.createdAt)}
                          </div>
                        </div>
                        <div className="cert-detail-box">
                          <div className="cert-detail-icon">🏆</div>
                          <div className="cert-detail-label">Donation #</div>
                          <div className="cert-detail-val">
                            #{getDonationNumber()}
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="cert-divider">
                        <div className="cert-divider-dot"></div>
                        <div className="cert-divider-line"></div>
                        <div className="cert-divider-dot"></div>
                      </div>

                      {/* Footer */}
                      <div className="cert-footer">
                        <div className="cert-signature-block">
                          <div className="cert-signature-line"></div>
                          <div className="cert-sig-name">BloodBridge Platform</div>
                          <div className="cert-sig-title">Authorized Issuer</div>
                        </div>
                        <div className="cert-footer-center">
                          <div className="cert-seal">
                            <div className="cert-seal-inner">
                              <span>BB</span>
                            </div>
                          </div>
                          <div className="cert-footer-text">
                            🌐 bloodbridge.pk
                          </div>
                        </div>
                        <div className="cert-signature-block">
                          <div className="cert-signature-line"></div>
                          <div className="cert-sig-name">Pakistan Blood Authority</div>
                          <div className="cert-sig-title">Verified Partner</div>
                        </div>
                      </div>

                      {/* Decorative corners */}
                      <div className="cert-corner cert-corner-tl">❧</div>
                      <div className="cert-corner cert-corner-tr">❧</div>
                      <div className="cert-corner cert-corner-bl">❧</div>
                      <div className="cert-corner cert-corner-br">❧</div>

                    </div>
                  </div>
                </div>
              </div>

              {/* Info cards when preview hidden */}
              {!preview && (
                <div className="cert-info-cards">
                  <div className="cert-info-card">
                    <span>🏆</span>
                    <h4>Official Certificate</h4>
                    <p>Professionally designed PDF certificate with your name and donation details</p>
                  </div>
                  <div className="cert-info-card">
                    <span>📄</span>
                    <h4>A4 Landscape Format</h4>
                    <p>High resolution, print-ready PDF in standard A4 landscape orientation</p>
                  </div>
                  <div className="cert-info-card">
                    <span>🔖</span>
                    <h4>Unique Certificate ID</h4>
                    <p>Every certificate has a unique ID and issue date for verification</p>
                  </div>
                  <div className="cert-info-card">
                    <span>💾</span>
                    <h4>Instant Download</h4>
                    <p>Generated instantly in your browser — no waiting, no emails</p>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Certificate;