import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import {
  getBloodRequests,
  getMyResponses,
  getNotifications,
  updateDonorProfile,
  updateLocation
} from '../api/services';
import './DonorDashboard.css';

const DonorDashboard = () => {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();
  const [activeTab,    setActiveTab]    = useState('overview');
  const [requests,     setRequests]     = useState([]);
  const [myResponses,  setMyResponses]  = useState([]);
  const [notifs,       setNotifs]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [success,      setSuccess]      = useState('');
  const [error,        setError]        = useState('');
  const [profileForm,  setProfileForm]  = useState({
    available:  user?.available  ?? true,
    city:       user?.city       || '',
    healthNote: user?.healthNote || '',
    bloodGroup: user?.bloodGroup || ''
  });

  useEffect(() => {
    if (!user || user.role !== 'donor') {
      navigate('/login');
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [reqRes, myRes, notifRes] = await Promise.all([
        getBloodRequests({ bloodGroup: user.bloodGroup }),
        getMyResponses(),
        getNotifications()
      ]);
      setRequests(reqRes.data.slice(0, 5));
      setMyResponses(myRes.data.responses || []);
      setNotifs(notifRes.data.slice(0, 5));
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await updateDonorProfile(profileForm);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleGetLocation = () => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          await updateLocation({ latitude, longitude });
          setSuccess('Location updated!');
          setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
          setError('Location update failed');
        }
      },
      () => setError('Could not get location')
    );
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="dd-loading">
        <div className="dd-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dd-page">

      {/* Sidebar */}
      <aside className="dd-sidebar">
        <div className="dd-sidebar-top">
          <div className="dd-logo">🩸 BloodBridge</div>
          <div className="dd-user-info">
            <div className="dd-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="dd-user-name">{user?.name}</p>
              <p className="dd-user-role">Donor • {user?.bloodGroup}</p>
            </div>
          </div>
        </div>

        <nav className="dd-nav">
          {[
            { id: 'overview',  label: '📊 Overview'    },
            { id: 'requests',  label: '🆘 Requests'    },
            { id: 'responses', label: '💬 My Responses' },
            { id: 'profile',   label: '👤 Profile'     },
            { id: 'notifs',    label: `🔔 Notifications ${unreadCount > 0 ? `(${unreadCount})` : ''}` },
          ].map(tab => (
            <button
              key={tab.id}
              className={`dd-nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="dd-sidebar-bottom">
  <button
    className="dd-nav-btn"
    onClick={() => navigate('/donors')}
  >
    🗺️ Find Donors Map
  </button>
  <button
    className="dd-nav-btn"
    onClick={() => navigate('/requests')}
  >
    🆘 All Requests
  </button>
  <button
    className="dd-nav-btn"
    onClick={() => navigate('/accepted-requests')}
  >
    ✅ My Responses
  </button>
  <button
    className="dd-nav-btn"
    onClick={() => navigate('/chat')}
  >
    💬 Chat
  </button>
  <button
    className="dd-nav-btn"
    onClick={() => navigate('/certificate')}
  >
    🏆 My Certificates
  </button>
  <button
    className="dd-logout-btn"
    onClick={logout}
  >
    🚪 Logout
  </button>
</div>
      </aside>

      {/* Main Content */}
      <main className="dd-main">

        {/* Alerts */}
        {success && <div className="dd-success">{success}</div>}
        {error   && <div className="dd-error">{error}</div>}

        {/* ── Overview Tab ── */}
        {activeTab === 'overview' && (
          <div className="dd-content">
            <h2 className="dd-content-title">
              Welcome back, {user?.name}! 👋
            </h2>

            {/* Stats */}
            <div className="dd-stats-grid">
              <div className="dd-stat-card">
                <div className="dd-stat-icon">🩸</div>
                <div className="dd-stat-value">{user?.bloodGroup}</div>
                <div className="dd-stat-label">Blood Group</div>
              </div>
              <div className="dd-stat-card">
                <div className="dd-stat-icon">💬</div>
                <div className="dd-stat-value">{myResponses.length}</div>
                <div className="dd-stat-label">Responses Sent</div>
              </div>
              <div className="dd-stat-card">
                <div className="dd-stat-icon">✅</div>
                <div className="dd-stat-value">
                  {myResponses.filter(r => r.status === 'accepted').length}
                </div>
                <div className="dd-stat-label">Accepted</div>
              </div>
              <div className="dd-stat-card">
                <div className="dd-stat-icon">🔔</div>
                <div className="dd-stat-value">{unreadCount}</div>
                <div className="dd-stat-label">Unread Notifs</div>
              </div>
            </div>

            {/* Availability Toggle */}
            <div className="dd-availability-card">
              <div>
                <h3>Donation Availability</h3>
                <p>Toggle your availability for blood donation</p>
              </div>
              <label className="dd-toggle">
                <input
                  type="checkbox"
                  checked={profileForm.available}
                  onChange={async (e) => {
                    const val = e.target.checked;
                    setProfileForm(f => ({ ...f, available: val }));
                    try {
                      await updateDonorProfile({ available: val });
                      setSuccess(val ? 'You are now available!' : 'Marked as unavailable');
                      setTimeout(() => setSuccess(''), 2000);
                    } catch {}
                  }}
                />
                <span className="dd-toggle-slider"></span>
              </label>
            </div>

{/* Certificate Quick Access */}
<div
  className="dd-certificate-banner"
  onClick={() => navigate('/certificate')}
>
  <div className="dd-cert-left">
    <span className="dd-cert-icon">🏆</span>
    <div>
      <p className="dd-cert-title">Download Donation Certificate</p>
      <p className="dd-cert-sub">
        Get your official PDF certificate for completed donations
      </p>
    </div>
  </div>
  <button className="dd-cert-btn">Get Certificate →</button>
</div>
            {/* Recent Requests */}
            <div className="dd-section">
              <h3 className="dd-section-title">
                Recent Blood Requests for {user?.bloodGroup}
              </h3>
              {requests.length === 0 ? (
                <p className="dd-empty-text">No matching requests</p>
              ) : (
                requests.map(req => (
                  <div key={req._id} className="dd-request-item">
                    <span className="dd-req-blood">{req.bloodGroup}</span>
                    <div className="dd-req-info">
                      <p className="dd-req-city">{req.city}</p>
                      <p className="dd-req-detail">{req.details}</p>
                    </div>
                    <span
                      className="dd-req-urgency"
                      style={{
                        background:
                          req.urgency === 'critical' ? '#c0392b' :
                          req.urgency === 'urgent'   ? '#e67e22' : '#27ae60'
                      }}
                    >
                      {req.urgency}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── Requests Tab ── */}
        {activeTab === 'requests' && (
          <div className="dd-content">
            <h2 className="dd-content-title">🆘 Matching Blood Requests</h2>
            <p className="dd-content-sub">
              Requests compatible with your blood group {user?.bloodGroup}
            </p>
            {requests.length === 0 ? (
              <div className="dd-empty">
                <p>😔</p>
                <p>No matching requests right now</p>
              </div>
            ) : (
              <div className="dd-req-grid">
                {requests.map(req => (
                  <div key={req._id} className="dd-req-card">
                    <div className="dd-req-card-top">
                      <span className="dd-req-blood-big">{req.bloodGroup}</span>
                      <span
                        className="dd-req-urgency"
                        style={{
                          background:
                            req.urgency === 'critical' ? '#c0392b' :
                            req.urgency === 'urgent'   ? '#e67e22' : '#27ae60'
                        }}
                      >
                        {req.urgency?.toUpperCase()}
                      </span>
                    </div>
                    <p>📍 {req.city}</p>
                    <p>👤 {req.postedBy?.name}</p>
                    <p>📞 {req.postedBy?.phone}</p>
                    <p className="dd-req-details">{req.details}</p>
                    <button
                      className="dd-respond-btn"
                      onClick={() => navigate('/requests')}
                    >
                      Respond Now
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── My Responses Tab ── */}
        {activeTab === 'responses' && (
          <div className="dd-content">
            <h2 className="dd-content-title">💬 My Responses</h2>
            {myResponses.length === 0 ? (
              <div className="dd-empty">
                <p>💬</p>
                <p>You haven't responded to any requests yet</p>
                <button
                  className="dd-action-btn"
                  onClick={() => navigate('/requests')}
                >
                  Browse Requests
                </button>
                <button
                 className="dd-nav-btn"
                  onClick={() => navigate('/accepted-requests')}
                 >
                  ✅ My Responses
                </button>
                <button
  className="dd-nav-btn"
  onClick={() => navigate('/accepted-requests')}
>
  ✅ My Responses
</button>
<button
  className="dd-nav-btn"
  onClick={() => navigate('/chat')}
>
  💬 Chat
</button>
<button
  className="dd-nav-btn"
  onClick={() => navigate('/certificate')}
>
  🏆 My Certificates
</button>
            <button
             className="dd-nav-btn"
             onClick={() => navigate('/chat')}
            >
              💬 Chat
            </button>
              </div>
            ) : (
              <div className="dd-responses-list">
                {myResponses.map(res => (
                  <div key={res._id} className="dd-response-item">
                    <div className="dd-response-left">
                      <span className="dd-res-blood">
                        {res.request?.bloodGroup}
                      </span>
                      <div>
                        <p className="dd-res-city">
                          📍 {res.request?.city}
                        </p>
                        <p className="dd-res-detail">
                          {res.request?.details}
                        </p>
                        <p className="dd-res-date">
                          {new Date(res.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className="dd-res-status"
                      style={{
                        background:
                          res.status === 'accepted' ? '#27ae60' :
                          res.status === 'rejected' ? '#e74c3c' : '#f39c12'
                      }}
                    >
                      {res.status?.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Profile Tab ── */}
        {activeTab === 'profile' && (
          <div className="dd-content">
            <h2 className="dd-content-title">👤 My Profile</h2>
            <div className="dd-profile-card">
              <form onSubmit={handleUpdateProfile} className="dd-profile-form">
                <div className="dd-profile-field">
                  <label>Blood Group</label>
                  <select
                    value={profileForm.bloodGroup}
                    onChange={e => setProfileForm(f => ({
                      ...f, bloodGroup: e.target.value
                    }))}
                  >
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="dd-profile-field">
                  <label>City</label>
                  <input
                    value={profileForm.city}
                    onChange={e => setProfileForm(f => ({
                      ...f, city: e.target.value
                    }))}
                    placeholder="Your city"
                  />
                </div>
                <div className="dd-profile-field">
                  <label>Health Note</label>
                  <textarea
                    value={profileForm.healthNote}
                    onChange={e => setProfileForm(f => ({
                      ...f, healthNote: e.target.value
                    }))}
                    placeholder="Any health conditions..."
                    rows={3}
                  />
                </div>
                <div className="dd-profile-btns">
                  <button type="submit" className="dd-save-btn">
                    Save Changes
                  </button>
                  <button
                    type="button"
                    className="dd-location-btn"
                    onClick={handleGetLocation}
                  >
                    📍 Update Location
                  </button>
                </div>
              </form>

              <div className="dd-profile-info">
                <h4>Account Info</h4>
                <p><b>Name:</b>  {user?.name}</p>
                <p><b>Email:</b> {user?.email}</p>
                <p><b>Phone:</b> {user?.phone}</p>
                <p><b>Role:</b>  {user?.role}</p>
                <p>
                  <b>Status:</b>{' '}
                  <span style={{ color: profileForm.available ? '#27ae60' : '#e74c3c' }}>
                    {profileForm.available ? '✅ Available' : '❌ Unavailable'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Notifications Tab ── */}
        {activeTab === 'notifs' && (
          <div className="dd-content">
            <h2 className="dd-content-title">🔔 Notifications</h2>
            {notifs.length === 0 ? (
              <div className="dd-empty">
                <p>🔔</p>
                <p>No notifications</p>
              </div>
            ) : (
              <div className="dd-notif-list">
                {notifs.map(notif => (
                  <div
                    key={notif._id}
                    className={`dd-notif-item ${!notif.read ? 'unread' : ''}`}
                  >
                    <span className="dd-notif-icon">
                      {notif.type === 'request' ? '🩸' : '🔔'}
                    </span>
                    <div className="dd-notif-body">
                      <p>{notif.message}</p>
                      <span>
                        {new Date(notif.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  className="dd-view-all-btn"
                  onClick={() => navigate('/notifications')}
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
};

export default DonorDashboard;