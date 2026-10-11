import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import './Certificate.css';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';

const Certificate = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const certRef = useRef(null);

  const [donations, setDonations] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [preview, setPreview] = useState(false);

  const token = JSON.parse(
    localStorage.getItem('bloodbridge_user')
  )?.token;

  // =========================================================
  // LOAD CONFIRMED DONATIONS
  // =========================================================

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'donor') {
      navigate('/');
      return;
    }

    loadDonations();
  }, [user, navigate]);

  const loadDonations = async () => {
    try {
      setLoading(true);

      const res = await fetch(
        `${BACKEND}/api/responses/my-responses`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      // Only receiver-confirmed donations can generate
      // normal donation certificates.
      const confirmed = (data.responses || []).filter(
        (r) => r.donationConfirmed === true
      );

      setDonations(confirmed);

      if (confirmed.length > 0) {
        setSelected(confirmed[0]);
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading donations:', err);
      setLoading(false);
    }
  };

  // =========================================================
  // SPECIAL CERTIFICATE ELIGIBILITY
  // =========================================================

  const POINTS_PER_DONATION = 10;
  const SPECIAL_CERTIFICATE_POINTS = 100;

  const donorPoints =
    donations.length * POINTS_PER_DONATION;

  const specialCertificateUnlocked =
    donorPoints >= SPECIAL_CERTIFICATE_POINTS;

  const remainingPoints = Math.max(
    SPECIAL_CERTIFICATE_POINTS - donorPoints,
    0
  );

  // =========================================================
  // NORMAL DONATION CERTIFICATE PDF
  // =========================================================

  const generatePDF = async () => {
    if (!certRef.current) return;

    setGenerating(true);

    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const ratio = canvas.height / canvas.width;

      const imgW = pdfW;
      const imgH = imgW * ratio;

      const yOff = (pdfH - imgH) / 2;

      pdf.addImage(
        imgData,
        'PNG',
        0,
        yOff,
        imgW,
        imgH
      );

      const donorName =
        user?.name?.replace(/\s+/g, '_') || 'Donor';

      const dateStr = selected
        ? new Date(selected.createdAt)
            .toLocaleDateString('en-PK')
            .replace(/\//g, '-')
        : 'Certificate';

      pdf.save(
        `BloodBridge_Certificate_${donorName}_${dateStr}.pdf`
      );
    } catch (err) {
      console.error('PDF generation error:', err);
    }

    setGenerating(false);
  };

  // =========================================================
  // SPECIAL CONTRIBUTION CERTIFICATE PDF
  // =========================================================

 // =========================================================
// SPECIAL CONTRIBUTION CERTIFICATE PDF
// =========================================================

const generateSpecialCertificatePDF = () => {
  if (!specialCertificateUnlocked) {
    alert(
      'You need at least 100 points to unlock this certificate.'
    );
    return;
  }

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const donorName = user?.name || 'Blood Donor';
  const safeDonorName =
    donorName.replace(/\s+/g, '_');

  const issueDate =
    new Date().toLocaleDateString('en-PK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  const certificateId =
    `BB-SC-${String(donations.length).padStart(
      3,
      '0'
    )}-${new Date().getFullYear()}`;

  // =====================================================
  // BACKGROUND
  // =====================================================

  doc.setFillColor(255, 250, 250);
  doc.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    'F'
  );

  // =====================================================
  // DECORATIVE TOP AND BOTTOM BARS
  // =====================================================

  doc.setFillColor(128, 0, 32);

  doc.rect(
    0,
    0,
    pageWidth,
    12,
    'F'
  );

  doc.rect(
    0,
    pageHeight - 10,
    pageWidth,
    10,
    'F'
  );

  // Red accent under top bar
  doc.setFillColor(220, 53, 69);

  doc.rect(
    0,
    12,
    pageWidth,
    3,
    'F'
  );

  // =====================================================
  // OUTER BORDER
  // =====================================================

  doc.setDrawColor(128, 0, 32);
  doc.setLineWidth(1.5);

  doc.roundedRect(
    8,
    19,
    pageWidth - 16,
    pageHeight - 37,
    3,
    3
  );

  // =====================================================
  // INNER BORDER
  // =====================================================

  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(0.5);

  doc.roundedRect(
    12,
    23,
    pageWidth - 24,
    pageHeight - 45,
    2,
    2
  );

  // =====================================================
  // DECORATIVE CORNERS
  // =====================================================

  doc.setFillColor(128, 0, 32);

  // Top left
  doc.circle(
    17,
    28,
    2.3,
    'F'
  );

  // Top right
  doc.circle(
    pageWidth - 17,
    28,
    2.3,
    'F'
  );

  // Bottom left
  doc.circle(
    17,
    pageHeight - 27,
    2.3,
    'F'
  );

  // Bottom right
  doc.circle(
    pageWidth - 17,
    pageHeight - 27,
    2.3,
    'F'
  );

  // =====================================================
  // BLOOD DROP / LOGO CIRCLE
  // =====================================================

  doc.setFillColor(128, 0, 32);

  doc.circle(
    pageWidth / 2,
    30,
    8,
    'F'
  );

  doc.setTextColor(255, 255, 255);
  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(10);

  doc.text(
    'BB',
    pageWidth / 2,
    33,
    {
      align: 'center',
    }
  );

  // =====================================================
  // BRAND NAME
  // =====================================================

  doc.setTextColor(128, 0, 32);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(20);

  doc.text(
    'BLOOD BRIDGE',
    pageWidth / 2,
    44,
    {
      align: 'center',
    }
  );

  // Tagline
  doc.setTextColor(100, 100, 100);

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(8.5);

  doc.text(
    'Connecting Donors  |  Saving Lives  |  Building Hope',
    pageWidth / 2,
    50,
    {
      align: 'center',
    }
  );

  // =====================================================
  // DECORATIVE TITLE LINES
  // =====================================================

  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(0.7);

  doc.line(
    35,
    57,
    92,
    57
  );

  doc.line(
    pageWidth - 92,
    57,
    pageWidth - 35,
    57
  );

  doc.setFillColor(220, 53, 69);

  doc.circle(
    pageWidth / 2,
    57,
    1.5,
    'F'
  );

  // =====================================================
  // CERTIFICATE TITLE
  // =====================================================

  doc.setTextColor(70, 15, 25);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(24);

  doc.text(
    'SPECIAL CONTRIBUTION',
    pageWidth / 2,
    68,
    {
      align: 'center',
    }
  );

  doc.setTextColor(128, 0, 32);

  doc.setFontSize(15);

  doc.text(
    'CERTIFICATE OF APPRECIATION',
    pageWidth / 2,
    77,
    {
      align: 'center',
    }
  );

  // =====================================================
  // PRESENTED TO
  // =====================================================

  doc.setTextColor(90, 90, 90);

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(10);

  doc.text(
    'This certificate is proudly presented to',
    pageWidth / 2,
    88,
    {
      align: 'center',
    }
  );

  // =====================================================
  // DONOR NAME
  // =====================================================

  doc.setTextColor(128, 0, 32);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(27);

  doc.text(
    donorName,
    pageWidth / 2,
    101,
    {
      align: 'center',
    }
  );

  // Donor name underline
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(0.6);

  doc.line(
    75,
    105,
    pageWidth - 75,
    105
  );

  // =====================================================
  // APPRECIATION MESSAGE
  // =====================================================

  doc.setTextColor(70, 70, 70);

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(10.5);

  doc.text(
    'In recognition of your outstanding dedication, compassion, and',
    pageWidth / 2,
    114,
    {
      align: 'center',
    }
  );

  doc.text(
    'valuable contribution to the Blood Bridge community through voluntary blood donation.',
    pageWidth / 2,
    121,
    {
      align: 'center',
    }
  );

  doc.setTextColor(128, 0, 32);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(10.5);

  doc.text(
    'Your generosity gives hope, saves lives, and inspires humanity.',
    pageWidth / 2,
    129,
    {
      align: 'center',
    }
  );

  // =====================================================
  // ACHIEVEMENT CARDS
  // =====================================================

  // POINTS CARD
  doc.setFillColor(255, 239, 241);
  doc.setDrawColor(220, 53, 69);
  doc.setLineWidth(0.5);

  doc.roundedRect(
    62,
    138,
    52,
    25,
    3,
    3,
    'FD'
  );

  doc.setTextColor(128, 0, 32);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(16);

  doc.text(
    `${donorPoints}`,
    88,
    149,
    {
      align: 'center',
    }
  );

  doc.setFontSize(8);

  doc.setTextColor(90, 90, 90);

  doc.text(
    'TOTAL POINTS',
    88,
    157,
    {
      align: 'center',
    }
  );

  // =====================================================
  // DONATIONS CARD
  // =====================================================

  doc.setFillColor(255, 239, 241);
  doc.setDrawColor(220, 53, 69);

  doc.roundedRect(
    122,
    138,
    52,
    25,
    3,
    3,
    'FD'
  );

  doc.setTextColor(128, 0, 32);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(16);

  doc.text(
    `${donations.length}`,
    148,
    149,
    {
      align: 'center',
    }
  );

  doc.setFontSize(8);

  doc.setTextColor(90, 90, 90);

  doc.text(
    'CONFIRMED DONATIONS',
    148,
    157,
    {
      align: 'center',
    }
  );

  // =====================================================
  // ACHIEVEMENT CARD
  // =====================================================

  doc.setFillColor(128, 0, 32);
  doc.setDrawColor(128, 0, 32);

  doc.roundedRect(
    182,
    138,
    52,
    25,
    3,
    3,
    'FD'
  );

  doc.setTextColor(255, 255, 255);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(12);

  doc.text(
    'SPECIAL',
    208,
    149,
    {
      align: 'center',
    }
  );

  doc.setFontSize(8);

  doc.text(
    'CONTRIBUTOR',
    208,
    157,
    {
      align: 'center',
    }
  );

  // =====================================================
  // SIGNATURE SECTION
  // =====================================================

  doc.setDrawColor(120, 120, 120);
  doc.setLineWidth(0.4);

  // Left signature line
  doc.line(
    35,
    178,
    92,
    178
  );

  doc.setTextColor(60, 60, 60);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(8.5);

  doc.text(
    'BloodBridge Platform',
    63.5,
    183,
    {
      align: 'center',
    }
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(7);

  doc.setTextColor(120, 120, 120);

  doc.text(
    'Authorized Issuer',
    63.5,
    187,
    {
      align: 'center',
    }
  );

  // =====================================================
  // CENTER SEAL
  // =====================================================

  doc.setFillColor(128, 0, 32);

  doc.circle(
    pageWidth / 2,
    178,
    9,
    'F'
  );

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);

  doc.circle(
    pageWidth / 2,
    178,
    6.5
  );

  doc.setTextColor(255, 255, 255);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(8);

  doc.text(
    'BB',
    pageWidth / 2,
    176.5,
    {
      align: 'center',
    }
  );

  doc.setFontSize(5);

  doc.text(
    'VERIFIED',
    pageWidth / 2,
    181,
    {
      align: 'center',
    }
  );

  // =====================================================
  // DATE SIGNATURE
  // =====================================================

  doc.setDrawColor(120, 120, 120);

  doc.line(
    pageWidth - 92,
    178,
    pageWidth - 35,
    178
  );

  doc.setTextColor(60, 60, 60);

  doc.setFont(
    'helvetica',
    'bold'
  );

  doc.setFontSize(8.5);

  doc.text(
    issueDate,
    pageWidth - 63.5,
    183,
    {
      align: 'center',
    }
  );

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(7);

  doc.setTextColor(120, 120, 120);

  doc.text(
    'Date Issued',
    pageWidth - 63.5,
    187,
    {
      align: 'center',
    }
  );

  // =====================================================
  // CERTIFICATE ID
  // =====================================================

  doc.setTextColor(130, 130, 130);

  doc.setFont(
    'helvetica',
    'normal'
  );

  doc.setFontSize(6.5);

  doc.text(
    `Certificate ID: ${certificateId}`,
    16,
    pageHeight - 4
  );

  doc.text(
    'Blood Bridge - Connecting Donors, Saving Lives',
    pageWidth / 2,
    pageHeight - 4,
    {
      align: 'center',
    }
  );

  doc.text(
    'bloodbridge.pk',
    pageWidth - 16,
    pageHeight - 4,
    {
      align: 'right',
    }
  );

  // =====================================================
  // SAVE PDF
  // =====================================================

  doc.save(
    `BloodBridge_Special_Contribution_${safeDonorName}.pdf`
  );
};

  // =========================================================
  // HELPER FUNCTIONS
  // =========================================================

  const getDonationNumber = () => {
    if (
      !selected ||
      !donations.length
    ) {
      return 1;
    }

    const idx =
      donations.findIndex(
        (d) =>
          d._id === selected._id
      );

    return donations.length - idx;
  };

  const formatDate = (d) => {
    if (!d) return '';

    return new Date(
      d
    ).toLocaleDateString(
      'en-PK',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    );
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="cert-loading">
        <div className="cert-spinner"></div>

        <p>
          Loading your donation
          records...
        </p>
      </div>
    );
  }

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="cert-page">

      {/* ================= NAVBAR ================= */}

      <header className="cert-navbar">

        <div className="cert-nav-inner">

          <a
            href="/"
            className="cert-brand"
          >
            🩸 BloodBridge
          </a>

          <div className="cert-nav-right">

            <button
              className="cert-back-btn"
              onClick={() =>
                navigate(
                  '/donor/dashboard'
                )
              }
            >
              ← Dashboard
            </button>

          </div>

        </div>

      </header>

      {/* ================= MAIN CONTAINER ================= */}

      <div className="cert-container">

        <div className="cert-page-head">

          <div>

            <h1 className="cert-title">
              🏆 Donation Certificates
            </h1>

            <p className="cert-sub">
              Download official
              certificates for your
              confirmed blood donations
            </p>

          </div>

        </div>

        {/* =================================================
            NORMAL DONATION CERTIFICATE
        ================================================= */}

        {donations.length === 0 ? (

          <div className="cert-empty">

            <div className="cert-empty-icon">
              🏆
            </div>

            <h3>
              No completed donations yet
            </h3>

            <p>
              Your certificate will
              appear here after the
              receiver confirms your
              completed blood donation.
            </p>

            <button
              className="cert-find-btn"
              onClick={() =>
                navigate('/requests')
              }
            >
              Find Blood Requests
            </button>

          </div>

        ) : (

          <div className="cert-layout">

            {/* ================= LEFT SIDE ================= */}

            <div className="cert-sidebar">

              <h3 className="cert-sidebar-title">
                Select Donation (
                {donations.length})
              </h3>

              <div className="cert-donation-list">

                {donations.map(
                  (don, i) => (

                    <div
                      key={don._id}
                      className={`cert-donation-item ${
                        selected?._id ===
                        don._id
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setSelected(don)
                      }
                    >

                      <div
                        className="cert-item-blood"
                        style={{
                          background:
                            don.request
                              ?.bloodGroup ===
                            'O+'
                              ? '#27ae60'
                              : don.request
                                      ?.bloodGroup ===
                                    'O-'
                                ? '#1e8449'
                                : don.request
                                        ?.bloodGroup
                                        ?.startsWith(
                                          'A'
                                        )
                                  ? '#e74c3c'
                                  : don.request
                                          ?.bloodGroup
                                          ?.startsWith(
                                            'B'
                                          )
                                    ? '#e67e22'
                                    : '#8e44ad',
                        }}
                      >
                        {don.request
                          ?.bloodGroup ||
                          user?.bloodGroup}
                      </div>

                      <div className="cert-item-info">

                        <p className="cert-item-city">
                          📍{' '}
                          {don.request
                            ?.city ||
                            'Unknown'}
                        </p>

                        <p className="cert-item-date">
                          {formatDate(
                            don.createdAt
                          )}
                        </p>

                      </div>

                      <span className="cert-item-num">
                        #
                        {donations.length -
                          i}
                      </span>

                    </div>

                  )
                )}

              </div>

            </div>

            {/* ================= RIGHT SIDE ================= */}

            <div className="cert-main">

              {/* ACTION BUTTONS */}

              <div className="cert-actions">

                <button
                  className="cert-preview-btn"
                  onClick={() =>
                    setPreview(
                      !preview
                    )
                  }
                >
                  {preview
                    ? '🙈 Hide Preview'
                    : '👁️ Show Preview'}
                </button>

                <button
                  className="cert-download-btn"
                  onClick={generatePDF}
                  disabled={
                    generating
                  }
                >
                  {generating
                    ? '⏳ Generating...'
                    : '⬇️ Download PDF'}
                </button>

              </div>

              {/* CERTIFICATE PREVIEW */}

              <div
                className={`cert-preview-wrap ${
                  preview
                    ? 'visible'
                    : ''
                }`}
              >

                <div
                  className="cert-doc"
                  ref={certRef}
                >

                  <div className="cert-outer-border">

                    <div className="cert-inner-border">

                      {/* HEADER */}

                      <div className="cert-header">

                        <div className="cert-logo-area">

                          <div className="cert-logo-circle">
                            🩸
                          </div>

                          <div>

                            <div className="cert-org-name">
                              BloodBridge
                            </div>

                            <div className="cert-org-sub">
                              Blood Donation
                              Network Pakistan
                            </div>

                          </div>

                        </div>

                        <div className="cert-header-right">

                          <div className="cert-cert-no">
                            CERT #
                            {String(
                              getDonationNumber()
                            ).padStart(
                              4,
                              '0'
                            )}
                          </div>

                          <div className="cert-issue-date">
                            Issued:{' '}
                            {formatDate(
                              selected
                                ?.createdAt
                            )}
                          </div>

                        </div>

                      </div>

                      {/* DIVIDER */}

                      <div className="cert-divider">

                        <div className="cert-divider-dot"></div>

                        <div className="cert-divider-line"></div>

                        <div className="cert-divider-dot"></div>

                      </div>

                      {/* TITLE */}

                      <div className="cert-title-area">

                        <div className="cert-cert-title">
                          Certificate of
                          Appreciation
                        </div>

                        <div className="cert-cert-subtitle">
                          Blood Donation
                          Achievement
                        </div>

                      </div>

                      {/* MAIN TEXT */}

                      <div className="cert-body-text">

                        <p className="cert-presented-to">
                          This certificate
                          is proudly
                          presented to
                        </p>

                        <div className="cert-recipient-name">
                          {user?.name}
                        </div>

                        <p className="cert-desc">

                          In recognition of
                          your extraordinary
                          act of humanity and
                          compassion in
                          donating{' '}

                          <strong>
                            {selected
                              ?.request
                              ?.bloodGroup ||
                              user?.bloodGroup}
                          </strong>{' '}

                          blood

                          {selected?.request
                            ?.city
                            ? ` to a patient in ${selected.request.city}`
                            : ''}

                          , thereby
                          contributing to
                          the gift of life.
                          Your selfless
                          donation may have
                          saved up to{' '}

                          <strong>
                            3 lives
                          </strong>
                          .

                        </p>

                      </div>

                      {/* DETAILS */}

                      <div className="cert-details-row">

                        <div className="cert-detail-box">

                          <div className="cert-detail-icon">
                            🩸
                          </div>

                          <div className="cert-detail-label">
                            Blood Group
                          </div>

                          <div className="cert-detail-val">
                            {selected
                              ?.request
                              ?.bloodGroup ||
                              user?.bloodGroup}
                          </div>

                        </div>

                        <div className="cert-detail-box">

                          <div className="cert-detail-icon">
                            📍
                          </div>

                          <div className="cert-detail-label">
                            City
                          </div>

                          <div className="cert-detail-val">
                            {selected
                              ?.request
                              ?.city ||
                              user?.city ||
                              'Pakistan'}
                          </div>

                        </div>

                        <div className="cert-detail-box">

                          <div className="cert-detail-icon">
                            📅
                          </div>

                          <div className="cert-detail-label">
                            Donation Date
                          </div>

                          <div className="cert-detail-val">
                            {formatDate(
                              selected
                                ?.createdAt
                            )}
                          </div>

                        </div>

                        <div className="cert-detail-box">

                          <div className="cert-detail-icon">
                            🏆
                          </div>

                          <div className="cert-detail-label">
                            Donation #
                          </div>

                          <div className="cert-detail-val">
                            #
                            {getDonationNumber()}
                          </div>

                        </div>

                      </div>

                      {/* DIVIDER */}

                      <div className="cert-divider">

                        <div className="cert-divider-dot"></div>

                        <div className="cert-divider-line"></div>

                        <div className="cert-divider-dot"></div>

                      </div>

                      {/* FOOTER */}

                      <div className="cert-footer">

                        <div className="cert-signature-block">

                          <div className="cert-signature-line"></div>

                          <div className="cert-sig-name">
                            BloodBridge
                            Platform
                          </div>

                          <div className="cert-sig-title">
                            Authorized
                            Issuer
                          </div>

                        </div>

                        <div className="cert-footer-center">

                          <div className="cert-seal">

                            <div className="cert-seal-inner">
                              <span>
                                BB
                              </span>
                            </div>

                          </div>

                          <div className="cert-footer-text">
                            🌐
                            bloodbridge.pk
                          </div>

                        </div>

                        <div className="cert-signature-block">

                          <div className="cert-signature-line"></div>

                          <div className="cert-sig-name">
                            Pakistan Blood
                            Authority
                          </div>

                          <div className="cert-sig-title">
                            Verified Partner
                          </div>

                        </div>

                      </div>

                      {/* DECORATIVE CORNERS */}

                      <div className="cert-corner cert-corner-tl">
                        ❧
                      </div>

                      <div className="cert-corner cert-corner-tr">
                        ❧
                      </div>

                      <div className="cert-corner cert-corner-bl">
                        ❧
                      </div>

                      <div className="cert-corner cert-corner-br">
                        ❧
                      </div>

                    </div>

                  </div>

                </div>

              </div>

              {/* INFORMATION CARDS */}

              {!preview && (

                <div className="cert-info-cards">

                  <div className="cert-info-card">

                    <span>🏆</span>

                    <h4>
                      Official Certificate
                    </h4>

                    <p>
                      Professionally
                      designed PDF
                      certificate with
                      your name and
                      donation details
                    </p>

                  </div>

                  <div className="cert-info-card">

                    <span>📄</span>

                    <h4>
                      A4 Landscape Format
                    </h4>

                    <p>
                      High resolution,
                      print-ready PDF in
                      standard A4
                      landscape
                      orientation
                    </p>

                  </div>

                  <div className="cert-info-card">

                    <span>🔖</span>

                    <h4>
                      Unique Certificate
                      ID
                    </h4>

                    <p>
                      Every certificate
                      has a unique ID and
                      issue date for
                      verification
                    </p>

                  </div>

                  <div className="cert-info-card">

                    <span>💾</span>

                    <h4>
                      Instant Download
                    </h4>

                    <p>
                      Generated instantly
                      in your browser —
                      no waiting, no
                      emails
                    </p>

                  </div>

                </div>

              )}

            </div>

          </div>

        )}

        {/* =================================================
            SPECIAL CONTRIBUTION CERTIFICATE
        ================================================= */}

        <div className="special-certificate-section">

          <h2>
            🏆 Special Contribution
            Certificate
          </h2>

          {specialCertificateUnlocked ? (

            <>

              <h3>
                Congratulations!
              </h3>

              <p>
                You have reached{' '}
                <strong>
                  {donorPoints} points
                </strong>{' '}
                and unlocked the Special
                Contribution Certificate.
              </p>

              <button
                type="button"
                className="cert-download-btn"
                onClick={
                  generateSpecialCertificatePDF
                }
              >
                🏆 Download Special
                Certificate
              </button>

            </>

          ) : (

            <>

              <p>
                Reach 100 points to
                unlock your Special
                Contribution
                Certificate.
              </p>

              <p>
                <strong>
                  Current Points:{' '}
                  {donorPoints} / 100
                </strong>
              </p>

            </>

          )}

        </div>

      </div>

    </div>
  );
};

export default Certificate;