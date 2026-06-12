import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth }               from '../context/AuthContext';
import './DonorProfile.css';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';

const DonorProfile = () => {
  const { donorId }  = useParams();
  const { user }     = useAuth();
  const navigate     = useNavigate();

  const [donor,      setDonor]      = useState(null);
  const [responses,  setResponses]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('overview');
  const [bookmarked, setBookmarked] = useState(false);

  const token = JSON.parse(
    localStorage.getItem('bloodbridge_user')
  )?.token;

  const apiFetch = async (url) => {
    const res = await fetch(`${BACKEND}/api${url}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });
    return res.json();
  };

  useEffect(() => {
    if (donorId) {
      loadProfile();
      if (token) checkBookmark();
    }
  }, [donorId]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // Get donor info from users endpoint
      const data = await apiFetch(`/donors/${donorId}`);
      setDonor(data);

      // Try loading responses/donation history
      try {
        const rdata = await apiFetch(`/responses/donor/${donorId}/public`);
        setResponses(rdata.responses || []);
      } catch (e) {
        setResponses([]);
      }

      setLoading(false);
    } catch (err) {
      setError('Donor profile not found');
      setLoading(false);
    }
  };

  const checkBookmark = async () => {
    try {
      const data = await apiFetch(`/bookmarks/check/${donorId}`);
      setBookmarked(data.bookmarked || false);
    } catch (e) {}
  };

  const handleBookmark = async () => {
    if (!user) { navigate('/login'); return; }
    try {
      if (bookmarked) {
        await fetch(`${BACKEND}/api/bookmarks/${donorId}`, {
          method:  'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookmarked(false);
      } else {
        await fetch(`${BACKEND}/api/bookmarks`, {
          method:  'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization:  `Bearer ${token}`
          },
          body: JSON.stringify({ donorId })
        });
        setBookmarked(true);
      }
    } catch (e) {}
  };

  // ── Badge System ─────────────────────────────────────────
  const getBadges = (donor, donationCount) => {
    const badges = [];

    if (donationCount >= 1) {
      badges.push({
        icon: '🩸',
        label: 'First Donor',
        desc: 'Made first blood donation',
        color: '#e74c3c'
      });
    }
    if (donationCount >= 3) {
      badges.push({
        icon: '⭐',
        label: 'Regular Donor',
        desc: '3+ donations completed',
        color: '#f39c12'
      });
    }
    if (donationCount >= 5) {
      badges.push({
        icon: '🥇',
        label: 'Gold Donor',
        desc: '5+ donations — life saver!',
        color: '#f39c12'
      });
    }
    if (donationCount >= 10) {
      badges.push({
        icon: '👑',
        label: 'Platinum Donor',
        desc: '10+ donations — hero!',
        color: '#8e44ad'
      });
    }
    if (donor?.available) {
      badges.push({
        icon: '✅',
        label: 'Available Now',
        desc: 'Ready to donate',
        color: '#27ae60'
      });
    }
    if (donor?.bloodGroup === 'O-') {
      badges.push({
        icon: '🌍',
        label: 'Universal Donor',
        desc: 'O- blood type — rarest gift',
        color: '#2980b9'
      });
    }
    if (donor?.bloodGroup === 'AB+') {
      badges.push({
        icon: '💎',
        label: 'Universal Recipient',
        desc: 'AB+ blood type',
        color: '#8e44ad'
      });
    }
    if (responses.some(r => r.status === 'accepted' && r.request?.urgency === 'critical')) {
      badges.push({
        icon: '🚨',
        label: 'Emergency Hero',
        desc: 'Responded to critical request',
        color: '#c0392b'
      });
    }

    return badges;
  };

  const getPoints = (count) => count * 10;

  const getLevel = (points) => {
    if (points >= 100) return { label: 'Platinum', color: '#8e44ad', icon: '👑' };
    if (points >= 50)  return { label: 'Gold',     color: '#f39c12', icon: '🥇' };
    if (points >= 20)  return { label: 'Silver',   color: '#95a5a6', icon: '🥈' };
    if (points >= 10)  return { label: 'Bronze',   color: '#cd7f32', icon: '🥉' };
    return               { label: 'Starter',   color: '#888',    icon: '⭐' };
  };

  const bloodColor = (bg) => {
    const c = {
      'A+':'#e74c3c','A-':'#c0392b','B+':'#e67e22','B-':'#d35400',
      'AB+':'#8e44ad','AB-':'#6c3483','O+':'#27ae60','O-':'#1e8449'
    };
    return c[bg] || '#c0392b';
  };

  const acceptedDonations = responses.filter(r => r.status === 'accepted').length;
  const pendingResponses  = responses.filter(r => r.status === 'pending').length;
  const totalPoints       = getPoints(acceptedDonations);
  const level             = getLevel(totalPoints);
  const badges            = getBadges(donor, acceptedDonations);

  if (loading) {
    return (
      <div className="dp-loading">
        <div className="dp-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (error || !donor) {
    return (
      <div className="dp-error">
        <div style={{ fontSize: 64 }}>😔</div>
        <h2>Profile Not Found</h2>
        <p>{error || 'This donor profile does not exist'}</p>
        <button className="dp-back-btn" onClick={() => navigate('/donors')}>
          ← Back to Donors
        </button>
      </div>
    );
  }

  return (
    <div className="dp-page">

      {/* Navbar */}
      <header className="dp-navbar">
        <div className="dp-nav-inner">
          <a href="/" className="dp-brand">🩸 BloodBridge</a>
          <div className="dp-nav-right">
            <button className="dp-back-btn-sm" onClick={() => navigate('/donors')}>
              ← All Donors
            </button>
           {user && (
  <a
    href={
      user.role === 'donor'
        ? '/donor/dashboard'
        : user.role === 'receiver'
        ? '/receiver/dashboard'
        : '/admin/dashboard'
    }
    className="dp-dash-btn"
  >
    Dashboard
  </a>
)}
          </div>
        </div>
      </header>

      {/* ── Profile Hero ── */}
      <div className="dp-hero">
        <div className="dp-hero-inner">
          {/* Avatar */}
          <div
            className="dp-avatar"
            style={{ background: bloodColor(donor.bloodGroup) }}
          >
            {donor.name?.charAt(0)?.toUpperCase()}
          </div>

          {/* Basic Info */}
          <div className="dp-hero-info">
            <div className="dp-hero-top">
              <h1 className="dp-name">{donor.name}</h1>
              <span
                className={`dp-avail-badge ${donor.available ? 'yes' : 'no'}`}
              >
                {donor.available ? '✅ Available to Donate' : '❌ Unavailable'}
              </span>
            </div>

            <div className="dp-hero-meta">
              <span>📍 {donor.city || 'Unknown City'}</span>
              <span>📞 {donor.phone || 'N/A'}</span>
              <span>
                🩸 Blood Group:&nbsp;
                <b style={{ color: bloodColor(donor.bloodGroup) }}>
                  {donor.bloodGroup}
                </b>
              </span>
            </div>

            {/* Level Badge */}
            <div className="dp-level-badge" style={{ borderColor: level.color }}>
              <span>{level.icon}</span>
              <span style={{ color: level.color, fontWeight: 700 }}>
                {level.label} Donor
              </span>
              <span className="dp-level-pts">{totalPoints} pts</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="dp-hero-actions">
            {donor.phone && (
              <a href={`tel:${donor.phone}`} className="dp-call-btn">
                📞 Call Now
              </a>
            )}
            {user && (
              <button
                className="dp-chat-btn"
                onClick={() => navigate(
                  `/chat?userId=${donor._id}&name=${encodeURIComponent(donor.name)}&phone=${encodeURIComponent(donor.phone || '')}`
                )}
              >
                💬 Chat
              </button>
            )}
            {user?.role === 'receiver' && (
              <button
                className={`dp-bookmark-btn ${bookmarked ? 'saved' : ''}`}
                onClick={handleBookmark}
              >
                {bookmarked ? '🔖 Saved' : '🔖 Save Donor'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="dp-stats-bar">
        <div className="dp-stat">
          <span className="dp-stat-val" style={{ color: '#c0392b' }}>
            {acceptedDonations}
          </span>
          <span className="dp-stat-lbl">Donations</span>
        </div>
        <div className="dp-stat">
          <span className="dp-stat-val" style={{ color: '#f39c12' }}>
            {responses.length}
          </span>
          <span className="dp-stat-lbl">Total Responses</span>
        </div>
        <div className="dp-stat">
          <span className="dp-stat-val" style={{ color: '#27ae60' }}>
            {totalPoints}
          </span>
          <span className="dp-stat-lbl">Points Earned</span>
        </div>
        <div className="dp-stat">
          <span className="dp-stat-val" style={{ color: '#8e44ad' }}>
            {badges.length}
          </span>
          <span className="dp-stat-lbl">Badges</span>
        </div>
        <div className="dp-stat">
          <span className="dp-stat-val" style={{ color: '#2980b9' }}>
            {acceptedDonations * 3}
          </span>
          <span className="dp-stat-lbl">Lives Saved</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="dp-container">
        <div className="dp-tabs">
          {['overview', 'badges', 'history'].map(tab => (
            <button
              key={tab}
              className={`dp-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'overview' && '👤 Overview'}
              {tab === 'badges'   && `🏆 Badges (${badges.length})`}
              {tab === 'history'  && `📋 History (${responses.length})`}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div className="dp-tab-content">
            <div className="dp-overview-grid">

              {/* About Card */}
              <div className="dp-info-card">
                <h3>🩸 Donor Information</h3>
                <div className="dp-info-list">
                  <div className="dp-info-row">
                    <span className="dp-info-label">Full Name</span>
                    <span className="dp-info-val">{donor.name}</span>
                  </div>
                  <div className="dp-info-row">
                    <span className="dp-info-label">Blood Group</span>
                    <span
                      className="dp-blood-tag"
                      style={{ background: bloodColor(donor.bloodGroup) }}
                    >
                      {donor.bloodGroup}
                    </span>
                  </div>
                  <div className="dp-info-row">
                    <span className="dp-info-label">City</span>
                    <span className="dp-info-val">
                      📍 {donor.city || 'Not specified'}
                    </span>
                  </div>
                  <div className="dp-info-row">
                    <span className="dp-info-label">Phone</span>
                    <span className="dp-info-val">
                      📞 {donor.phone || 'N/A'}
                    </span>
                  </div>
                  <div className="dp-info-row">
                    <span className="dp-info-label">Status</span>
                    <span style={{
                      color: donor.available ? '#27ae60' : '#e74c3c',
                      fontWeight: 700
                    }}>
                      {donor.available ? '✅ Available' : '❌ Unavailable'}
                    </span>
                  </div>
                  {donor.healthNote && (
                    <div className="dp-info-row">
                      <span className="dp-info-label">Health Note</span>
                      <span className="dp-info-val dp-health-note">
                        {donor.healthNote}
                      </span>
                    </div>
                  )}
                  <div className="dp-info-row">
                    <span className="dp-info-label">Member Since</span>
                    <span className="dp-info-val">
                      {new Date(donor.createdAt).toLocaleDateString('en-PK', {
                        month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Level Progress Card */}
              <div className="dp-info-card">
                <h3>📊 Donor Level Progress</h3>
                <div className="dp-level-progress">
                  {[
                    { label: 'Starter',  pts: 0,   icon: '⭐', color: '#888'    },
                    { label: 'Bronze',   pts: 10,  icon: '🥉', color: '#cd7f32' },
                    { label: 'Silver',   pts: 20,  icon: '🥈', color: '#95a5a6' },
                    { label: 'Gold',     pts: 50,  icon: '🥇', color: '#f39c12' },
                    { label: 'Platinum', pts: 100, icon: '👑', color: '#8e44ad' },
                  ].map((lvl, i) => {
                    const reached = totalPoints >= lvl.pts;
                    const isCurrent =
                      totalPoints >= lvl.pts &&
                      (i === 4 || totalPoints < [0,10,20,50,100,999][i+1]);
                    return (
                      <div
                        key={i}
                        className={`dp-level-row ${reached ? 'reached' : ''} ${isCurrent ? 'current' : ''}`}
                      >
                        <span className="dp-lvl-icon">{lvl.icon}</span>
                        <div className="dp-lvl-info">
                          <span
                            className="dp-lvl-name"
                            style={{ color: reached ? lvl.color : '#ccc' }}
                          >
                            {lvl.label}
                          </span>
                          <span className="dp-lvl-req">
                            {lvl.pts} points required
                          </span>
                        </div>
                        {isCurrent && (
                          <span
                            className="dp-lvl-current"
                            style={{ background: lvl.color }}
                          >
                            Current
                          </span>
                        )}
                        {reached && !isCurrent && (
                          <span className="dp-lvl-done">✓</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar to next level */}
                <div className="dp-progress-section">
                  <div className="dp-progress-label">
                    <span>{totalPoints} points</span>
                    <span>
                      Next: {
                        totalPoints < 10  ? 10  :
                        totalPoints < 20  ? 20  :
                        totalPoints < 50  ? 50  :
                        totalPoints < 100 ? 100 : '∞'
                      } pts
                    </span>
                  </div>
                  <div className="dp-progress-bar">
                    <div
                      className="dp-progress-fill"
                      style={{
                        width: `${Math.min(100, (totalPoints / (
                          totalPoints < 10  ? 10  :
                          totalPoints < 20  ? 20  :
                          totalPoints < 50  ? 50  : 100
                        )) * 100)}%`,
                        background: level.color
                      }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ── BADGES TAB ── */}
        {activeTab === 'badges' && (
          <div className="dp-tab-content">
            <h3 className="dp-section-title">
              🏆 Earned Badges
            </h3>
            {badges.length === 0 ? (
              <div className="dp-empty-badges">
                <span>🏆</span>
                <p>No badges earned yet</p>
                <small>Donate blood to earn badges!</small>
              </div>
            ) : (
              <div className="dp-badges-grid">
                {badges.map((badge, i) => (
                  <div key={i} className="dp-badge-card">
                    <div
                      className="dp-badge-icon"
                      style={{ background: `${badge.color}20`, borderColor: badge.color }}
                    >
                      <span>{badge.icon}</span>
                    </div>
                    <h4
                      className="dp-badge-label"
                      style={{ color: badge.color }}
                    >
                      {badge.label}
                    </h4>
                    <p className="dp-badge-desc">{badge.desc}</p>
                  </div>
                ))}

                {/* Locked badges */}
                {acceptedDonations < 10 && (
                  <div className="dp-badge-card locked">
                    <div className="dp-badge-icon locked-icon">
                      <span>🔒</span>
                    </div>
                    <h4 className="dp-badge-label locked-lbl">Platinum Donor</h4>
                    <p className="dp-badge-desc">
                      {10 - acceptedDonations} more donations needed
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <div className="dp-tab-content">
            <h3 className="dp-section-title">📋 Donation History</h3>
            {responses.length === 0 ? (
              <div className="dp-empty-badges">
                <span>📋</span>
                <p>No donation history yet</p>
                <small>Responses to blood requests will appear here</small>
              </div>
            ) : (
              <div className="dp-history-list">
                {responses.map((res, i) => (
                  <div
                    key={i}
                    className={`dp-history-item ${res.status}`}
                  >
                    <div className="dp-history-left">
                      <div
                        className="dp-history-blood"
                        style={{
                          background: bloodColor(
                            res.request?.bloodGroup || donor.bloodGroup
                          )
                        }}
                      >
                        {res.request?.bloodGroup || donor.bloodGroup}
                      </div>
                      <div>
                        <p className="dp-history-city">
                          📍 {res.request?.city || 'Unknown'}
                        </p>
                        <p className="dp-history-detail">
                          {res.request?.details || 'Blood donation request'}
                        </p>
                        <p className="dp-history-date">
                          🕐 {new Date(res.createdAt).toLocaleDateString('en-PK', {
                            day: 'numeric', month: 'short', year: 'numeric'
                          })}
                        </p>
                        {res.request?.urgency && (
                          <span
                            className="dp-history-urgency"
                            style={{
                              background:
                                res.request.urgency === 'critical' ? '#c0392b' :
                                res.request.urgency === 'urgent'   ? '#e67e22' : '#27ae60'
                            }}
                          >
                            {res.request.urgency.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="dp-history-right">
                      <span
                        className="dp-history-status"
                        style={{
                          background:
                            res.status === 'accepted' ? '#27ae60' :
                            res.status === 'rejected' ? '#e74c3c' : '#f39c12'
                        }}
                      >
                        {res.status === 'accepted' ? '✅ Donated' :
                         res.status === 'rejected' ? '❌ Not Selected' :
                         '⏳ Pending'}
                      </span>
                      {res.status === 'accepted' && (
                        <span className="dp-history-pts">+10 pts</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default DonorProfile;