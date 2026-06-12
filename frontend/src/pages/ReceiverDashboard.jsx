import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getBloodRequests,
  postBloodRequest,
  getBookmarks,
  removeBookmark,
  getNotifications,
  matchDonorsAPI
} from '../api/services';

import './ReceiverDashboard.css';

const ReceiverDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview');
  const [myRequests, setMyRequests] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [matchDonors, setMatchDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    bloodGroup: '',
    city: user?.city || '',
    urgency: 'urgent',
    details: ''
  });

  useEffect(() => {
    if (!user || user.role !== 'receiver') {
      navigate('/login');
      return;
    }

    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);

      const [reqRes, bookRes, notifRes] = await Promise.all([
        getBloodRequests(),
        getBookmarks(),
        getNotifications()
      ]);

      setMyRequests(reqRes.data.slice(0, 10));
      setBookmarks(bookRes.data);
      setNotifs(notifRes.data.slice(0, 5));

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError('Failed to load dashboard');
    }
  };

  const handleFindDonors = async () => {
    if (!form.bloodGroup) {
      setError('Please select blood group first');
      return;
    }

    try {
      const res = await matchDonorsAPI({
        bloodGroup: form.bloodGroup
      });

      const donors = Object.values(res.data.donors || {}).flat();

      setMatchDonors(donors);
      setActiveTab('match');
    } catch (err) {
      setError('Failed to find donors');
    }
  };

  const handlePostRequest = async (e) => {
    e.preventDefault();

    try {
      await postBloodRequest(form);

      setSuccess('Blood request posted successfully!');
      setError('');

      setForm({
        bloodGroup: '',
        city: user?.city || '',
        urgency: 'urgent',
        details: ''
      });

      fetchAll();

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to post request'
      );
    }
  };

  const handleRemoveBookmark = async (donorId) => {
    try {
      await removeBookmark(donorId);

      setBookmarks(prev =>
        prev.filter(b => b.donor?._id !== donorId)
      );

      setSuccess('Bookmark removed');

      setTimeout(() => {
        setSuccess('');
      }, 2000);
    } catch (err) {
      setError('Failed to remove bookmark');
    }
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  if (loading) {
    return (
      <div className="rd-loading">
        <div className="rd-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="rd-page">

      {/* Sidebar */}
      <aside className="rd-sidebar">

        <div className="rd-sidebar-top">

          <div className="rd-logo">
            🩸 BloodBridge
          </div>

          <div className="rd-user-info">

            <div className="rd-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>

            <div>
              <p className="rd-user-name">
                {user?.name}
              </p>

              <p className="rd-user-role">
                Receiver
              </p>
            </div>

          </div>

        </div>

        <nav className="rd-nav">

          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'request', label: '🆘 Post Request' },
            { id: 'match', label: '🔍 Find Donors' },
            { id: 'bookmarks', label: '🔖 Bookmarks' },
            {
              id: 'notifs',
              label: `🔔 Notifications ${
                unreadCount > 0 ? `(${unreadCount})` : ''
              }`
            }
          ].map(tab => (
            <button
              key={tab.id}
              className={`rd-nav-btn ${
                activeTab === tab.id ? 'active' : ''
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}

        </nav>

        <div className="rd-sidebar-bottom">

          <button
            className="rd-nav-btn"
            onClick={() => navigate('/donors')}
          >
            🗺️ Map View
          </button>

          <button
            className="rd-logout-btn"
            onClick={logout}
          >
            🚪 Logout
          </button>

        </div>

      </aside>

      {/* Main */}
      <main className="rd-main">

        {success && (
          <div className="rd-success">
            {success}
          </div>
        )}

        {error && (
          <div className="rd-error">
            {error}
          </div>
        )}

        {/* Overview */}
        {activeTab === 'overview' && (

          <div className="rd-content">

            <h2 className="rd-title">
              Welcome, {user?.name}! 👋
            </h2>

            <div className="rd-stats-grid">

              <div className="rd-stat">
                <div className="rd-stat-icon">🆘</div>
                <div className="rd-stat-val">
                  {myRequests.length}
                </div>
                <div className="rd-stat-lbl">
                  Total Requests
                </div>
              </div>

              <div className="rd-stat">
                <div className="rd-stat-icon">🔖</div>
                <div className="rd-stat-val">
                  {bookmarks.length}
                </div>
                <div className="rd-stat-lbl">
                  Bookmarks
                </div>
              </div>

              <div className="rd-stat">
                <div className="rd-stat-icon">🔔</div>
                <div className="rd-stat-val">
                  {unreadCount}
                </div>
                <div className="rd-stat-lbl">
                  Notifications
                </div>
              </div>

              <div className="rd-stat">
                <div className="rd-stat-icon">📍</div>
                <div className="rd-stat-val">
                  {user?.city || 'N/A'}
                </div>
                <div className="rd-stat-lbl">
                  City
                </div>
              </div>

            </div>

          </div>
        )}

        {/* Request */}
        {activeTab === 'request' && (

          <div className="rd-content">

            <h2 className="rd-title">
              🆘 Post Blood Request
            </h2>

            <div className="rd-form-card">

              <form
                onSubmit={handlePostRequest}
                className="rd-form"
              >

                <div className="rd-form-row">

                  <div className="rd-field">

                    <label>Blood Group *</label>

                    <select
                      value={form.bloodGroup}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          bloodGroup: e.target.value
                        })
                      }
                      required
                    >
                      <option value="">Select</option>

                      {[
                        'A+',
                        'A-',
                        'B+',
                        'B-',
                        'AB+',
                        'AB-',
                        'O+',
                        'O-'
                      ].map(bg => (
                        <option key={bg} value={bg}>
                          {bg}
                        </option>
                      ))}
                    </select>

                  </div>

                  <div className="rd-field">

                    <label>Urgency *</label>

                    <select
                      value={form.urgency}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          urgency: e.target.value
                        })
                      }
                    >
                      <option value="normal">Normal</option>
                      <option value="urgent">Urgent</option>
                      <option value="critical">Critical</option>
                    </select>

                  </div>

                </div>

                <div className="rd-field">

                  <label>City *</label>

                  <input
                    type="text"
                    placeholder="Lahore, Karachi..."
                    value={form.city}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        city: e.target.value
                      })
                    }
                    required
                  />

                </div>

                <div className="rd-field">

                  <label>Details</label>

                  <textarea
                    placeholder="Hospital name, patient info..."
                    value={form.details}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        details: e.target.value
                      })
                    }
                    rows={4}
                  />

                </div>

                <div className="rd-form-btns">

                  <button
                    type="submit"
                    className="rd-submit-btn"
                  >
                    Post Request
                  </button>

                  <button
                    type="button"
                    className="rd-match-btn"
                    onClick={handleFindDonors}
                  >
                    Find Matching Donors
                  </button>

                </div>

              </form>

            </div>

          </div>
        )}

        {/* Match Donors */}
        {activeTab === 'match' && (

          <div className="rd-content">

            <h2 className="rd-title">
              🔍 Matching Donors
            </h2>

            {matchDonors.length === 0 ? (

              <div className="rd-empty">
                <p>No donors found</p>
              </div>

            ) : (

              <div className="rd-donors-grid">

                {matchDonors.map((donor, i) => (

                  <div
                    key={i}
                    className="rd-donor-card"
                  >

                    <div className="rd-donor-blood">
                      {donor.bloodGroup}
                    </div>

                    <h4>{donor.name}</h4>

                    <p>📞 {donor.phone}</p>

                    <p>📍 {donor.city}</p>

                    <p
                      style={{
                        color: donor.available
                          ? '#27ae60'
                          : '#e74c3c'
                      }}
                    >
                      {donor.available
                        ? '✅ Available'
                        : '❌ Unavailable'}
                    </p>

                    <a
                      href={`tel:${donor.phone}`}
                      className="rd-call-btn"
                    >
                      📞 Call Now
                    </a>

                  </div>

                ))}

              </div>

            )}

          </div>
        )}

        {/* Bookmarks */}
        {activeTab === 'bookmarks' && (

          <div className="rd-content">

            <h2 className="rd-title">
              🔖 Saved Donors
            </h2>

            {bookmarks.length === 0 ? (

              <div className="rd-empty">
                <p>No bookmarks found</p>
              </div>

            ) : (

              <div className="rd-donors-grid">

                {bookmarks.map((bookmark, i) => {

                  const donor = bookmark.donor;

                  if (!donor) return null;

                  return (

                    <div
                      key={i}
                      className="rd-donor-card"
                    >

                      <div className="rd-donor-blood">
                        {donor.bloodGroup}
                      </div>

                      <h4>{donor.name}</h4>

                      <p>📞 {donor.phone}</p>

                      <p>📍 {donor.city}</p>

                      <div className="rd-donor-btns">

                        <a
                          href={`tel:${donor.phone}`}
                          className="rd-call-btn"
                        >
                          📞 Call
                        </a>

                        <button
                          className="rd-remove-btn"
                          onClick={() =>
                            handleRemoveBookmark(donor._id)
                          }
                        >
                          🗑️ Remove
                        </button>
                       <button
                        className="rd-nav-btn"
                        onClick={() => navigate('/accepted-requests')}
                       >
                       📋 Request Responses
                       </button>
                       <button
  className="rd-nav-btn"
  onClick={() => navigate('/accepted-requests')}
>
  📋 View Responses
</button>
<button
  className="rd-nav-btn"
  onClick={() => navigate('/chat')}
>
  💬 Chat
</button>
                <button
                  className="rd-nav-btn"
                  onClick={() => navigate('/chat')}
                 >
                  💬 Chat
                </button>
                      </div>

                    </div>

                  );

                })}

              </div>

            )}

          </div>
        )}

        {/* Notifications */}
        {activeTab === 'notifs' && (

          <div className="rd-content">

            <h2 className="rd-title">
              🔔 Notifications
            </h2>

            {notifs.length === 0 ? (

              <div className="rd-empty">
                <p>No notifications</p>
              </div>

            ) : (

              <div className="rd-notif-list">

                {notifs.map((notif) => (

                  <div
                    key={notif._id}
                    className={`rd-notif-item ${
                      !notif.read ? 'unread' : ''
                    }`}
                  >

                    <span>
                      {notif.type === 'request'
                        ? '🩸'
                        : '🔔'}
                    </span>

                    <div>

                      <p>{notif.message}</p>

                      <small>
                        {new Date(
                          notif.createdAt
                        ).toLocaleString()}
                      </small>

                    </div>

                  </div>

                ))}

              </div>

            )}

          </div>
        )}

      </main>

    </div>
  );
};

export default ReceiverDashboard;