import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getBloodRequests,
  postBloodRequest,
  respondToRequest,
  getMyResponses,
  getRequestResponses,
  acceptResponse,
  rejectResponse
} from '../api/services';
import './Requests.css';

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState({ bloodGroup: '', urgency: '', city: '' });
  const [form, setForm] = useState({
    bloodGroup: '', city: '', urgency: 'urgent', details: ''
  });
  // At top of Requests.jsx add this helper function
const openChatWith = (donorId, donorName, donorPhone) => {
  navigate(`/chat?userId=${donorId}&name=${encodeURIComponent(donorName)}&phone=${encodeURIComponent(donorPhone || '')}`);
};

  const [expanded, setExpanded] = useState(null);
  const [reqResponses, setReqResponses] = useState({});

  useEffect(() => {
    fetchRequests();
    if (user) fetchMyData();
  }, [filter, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.bloodGroup) params.bloodGroup = filter.bloodGroup;
      if (filter.urgency) params.urgency = filter.urgency;
      if (filter.city) params.city = filter.city;
      const res = await getBloodRequests(params);
      setRequests(res.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load requests');
      setLoading(false);
    }
  };

  const fetchMyData = async () => {
    try {
      if (user?.role === 'donor') {
        const res = await getMyResponses();
        setMyResponses(res.data.responses || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostRequest = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try {
      await postBloodRequest(form);
      setSuccess('✅ Blood request posted successfully!');
      setShowForm(false);
      setForm({ bloodGroup: '', city: '', urgency: 'urgent', details: '' });
      fetchRequests();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post request');
      setTimeout(() => setError(''), 3000);
    }
  };

const handleRespond = async (requestId) => {
  if (!user) { navigate('/login'); return; }
  if (user.role !== 'donor') {
    setError('Only donors can respond');
    setTimeout(() => setError(''), 3000);
    return;
  }
  try {
    const res = await respondToRequest(requestId, {
      message: `I am available to donate blood!`
    });
    setSuccess('✅ Response sent! Opening chat...');
    fetchMyData();
    // Auto go to chat with receiver
    setTimeout(() => {
      const rid  = res.data.receiverId;
      const name = res.data.receiverName  || 'Receiver';
      const ph   = res.data.receiverPhone || '';
      if (rid) {
        navigate(
          `/chat?userId=${rid}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(ph)}`
        );
      }
    }, 1500);
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to respond');
    setTimeout(() => setError(''), 3000);
  }
};

  const handleViewResponses = async (requestId) => {
    if (expanded === requestId) {
      setExpanded(null);
      return;
    }
    try {
      const res = await getRequestResponses(requestId);
      setReqResponses(prev => ({
        ...prev,
        [requestId]: res.data.responses || []
      }));
      setExpanded(requestId);
    } catch (err) {
      setError('Failed to load responses');
      setTimeout(() => setError(''), 3000);
    }
  };

const handleAccept = async (responseId, requestId, donor) => {
  try {
    const res = await acceptResponse(responseId);
    setSuccess('✅ Accepted! Opening chat...');

    const updated = await getRequestResponses(requestId);
    setReqResponses(prev => ({
      ...prev,
      [requestId]: updated.data.responses || []
    }));
    fetchRequests();

    setTimeout(() => {
      const did  = res.data.donorId    || donor?._id;
      const name = res.data.donorName  || donor?.name  || 'Donor';
      const ph   = res.data.donorPhone || donor?.phone || '';
      if (did) {
        navigate(
          `/chat?userId=${encodeURIComponent(did)}&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(ph)}`
        );
      }
    }, 1500);
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to accept');
    setTimeout(() => setError(''), 3000);
  }
};

  const handleReject = async (responseId, requestId) => {
    try {
      await rejectResponse(responseId);
      const res = await getRequestResponses(requestId);
      setReqResponses(prev => ({
        ...prev,
        [requestId]: res.data.responses || []
      }));
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('Failed to reject');
    }
  };

  // Add this helper function inside Requests component
const goToChat = (userId, name, phone) => {
  if (!userId) {
    alert('User information not available');
    return;
  }
  const url = `/chat?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name || 'User')}&phone=${encodeURIComponent(phone || '')}`;
  console.log('Navigating to chat:', url);
  navigate(url);
};

  const urgencyColor = (u) => {
    if (u === 'critical') return '#c0392b';
    if (u === 'urgent') return '#e67e22';
    return '#27ae60';
  };

  const alreadyResponded = (requestId) =>
    myResponses.some(r => r.request?._id === requestId || r.request === requestId);

  const myResponseStatus = (requestId) => {
    const r = myResponses.find(
      r => r.request?._id === requestId || r.request === requestId
    );
    return r?.status || null;
  };

  return (
    <div className="req-page">
      {/* Navbar */}
      <header className="req-navbar">
        <div className="req-nav-inner">
          <a href="/" className="req-brand">🩸 BloodBridge</a>
          <nav className="req-nav-links">
            <a href="/">Home</a>
            <a href="/requests" className="active">Requests</a>
            <a href="/donors">Donors</a>
          </nav>
          <div className="req-nav-auth">
            {user ? (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="req-chat-nav-btn"
                  onClick={() => navigate('/chat')}
                >
                  💬 Chat
                </button>
                <a
                  href={
                    user.role === 'donor' ? '/donor/dashboard' :
                    user.role === 'receiver' ? '/receiver/dashboard' :
                    '/admin/dashboard'
                  }
                  className="req-dashboard-btn"
                >
                  Dashboard
                </a>
              </div>
            ) : (
              <>
                <a href="/login" className="req-signin">Sign In</a>
                <a href="/register" className="req-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="req-container">

        {/* Header */}
        <div className="req-header">
          <div>
            <h1 className="req-title">🆘 Blood Requests</h1>
            <p className="req-sub">Find urgent blood requests near you</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {user && (
              <button
                className="req-chat-btn"
                onClick={() => navigate('/chat')}
              >
                💬 Chat
              </button>
            )}
            <button
              className="req-post-btn"
              onClick={() => {
                if (!user) navigate('/login');
                else setShowForm(!showForm);
              }}
            >
              + Post Request
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && <div className="req-error">❌ {error}</div>}
        {success && <div className="req-success">{success}</div>}

        {/* Tabs */}
        {user && (
          <div className="req-tabs">
            <button
              className={`req-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              📋 All Requests
            </button>
            {user.role === 'donor' && (
              <button
                className={`req-tab ${activeTab === 'my-responses' ? 'active' : ''}`}
                onClick={() => { setActiveTab('my-responses'); fetchMyData(); }}
              >
                💬 My Responses ({myResponses.length})
              </button>
            )}
            {user.role === 'receiver' && (
              <button
                className={`req-tab ${activeTab === 'my-requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-requests')}
              >
                📋 My Requests
              </button>
            )}
          </div>
        )}

        {/* Post Request Form */}
        {showForm && (
          <div className="req-form-card">
            <h3>🩸 Post New Blood Request</h3>
            <form onSubmit={handlePostRequest} className="req-form">
              <div className="req-form-row">
                <div className="req-form-field">
                  <label>Blood Group *</label>
                  <select
                    value={form.bloodGroup}
                    onChange={e => setForm({ ...form, bloodGroup: e.target.value })}
                    required
                  >
                    <option value="">Select</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="req-form-field">
                  <label>Urgency *</label>
                  <select
                    value={form.urgency}
                    onChange={e => setForm({ ...form, urgency: e.target.value })}
                  >
                    <option value="normal">Normal</option>
                    <option value="urgent">Urgent</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>
              <div className="req-form-field">
                <label>City *</label>
                <input
                  placeholder="Lahore, Karachi..."
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  required
                />
              </div>
              <div className="req-form-field">
                <label>Details (Hospital name, etc.)</label>
                <textarea
                  placeholder="Shaukat Khanum Hospital, need blood urgently..."
                  value={form.details}
                  onChange={e => setForm({ ...form, details: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="req-form-btns">
                <button type="submit" className="req-submit-btn">Post Request</button>
                <button
                  type="button"
                  className="req-cancel-btn"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── ALL REQUESTS TAB ── */}
        {activeTab === 'all' && (
          <>
            {/* Filters */}
            <div className="req-filters">
              <select
                value={filter.bloodGroup}
                onChange={e => setFilter({ ...filter, bloodGroup: e.target.value })}
                className="req-filter-select"
              >
                <option value="">All Blood Groups</option>
                {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              <select
                value={filter.urgency}
                onChange={e => setFilter({ ...filter, urgency: e.target.value })}
                className="req-filter-select"
              >
                <option value="">All Urgency</option>
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="critical">Critical</option>
              </select>
              <input
                placeholder="Filter by city..."
                value={filter.city}
                onChange={e => setFilter({ ...filter, city: e.target.value })}
                className="req-filter-input"
              />
              <button
                className="req-clear-btn"
                onClick={() => setFilter({ bloodGroup: '', urgency: '', city: '' })}
              >
                Clear Filters
              </button>
            </div>

            {loading ? (
              <div className="req-loading">Loading requests...</div>
            ) : requests.length === 0 ? (
              <div className="req-empty">
                <p>😔</p>
                <p>No blood requests found</p>
              </div>
            ) : (
              <div className="req-grid">
                {requests.map(req => {
                  const responded = alreadyResponded(req._id);
                  const resStatus = myResponseStatus(req._id);
                  const isMyRequest = req.postedBy?._id === user?._id ||
                                      req.postedBy === user?._id;

                  return (
                    <div key={req._id} className="req-card">
                      <div className="req-card-top">
                        <span className="req-blood">{req.bloodGroup}</span>
                        <span
                          className="req-urgency"
                          style={{ background: urgencyColor(req.urgency) }}
                        >
                          {req.urgency?.toUpperCase()}
                        </span>
                      </div>

                      <div className="req-card-body">
                        <p className="req-city">📍 {req.city}</p>
                        {req.details && (
                          <p className="req-details">{req.details}</p>
                        )}
                        <p className="req-posted-by">
                          👤 {req.postedBy?.name || 'Anonymous'}
                        </p>
                        <p className="req-phone">
                          📞 {req.postedBy?.phone || 'N/A'}
                        </p>
                        <p className="req-date">
                          🕐 {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="req-card-actions">
                        {/* Donor Actions */}
                        {user?.role === 'donor' && !isMyRequest && (
                          <>
                            {!responded ? (
                              <button
                                className="req-respond-btn"
                                onClick={() => handleRespond(req._id)}
                              >
                                🩸 Respond to Request
                              </button>
                            ) : (
                              <div className="req-responded-box">
                                <span
                                  className="req-responded-badge"
                                  style={{
                                    background:
                                      resStatus === 'accepted' ? '#27ae60' :
                                      resStatus === 'rejected' ? '#e74c3c' : '#f39c12'
                                  }}
                                >
                                  {resStatus === 'accepted' ? '✅ ACCEPTED' :
                                   resStatus === 'rejected' ? '❌ REJECTED' :
                                   '⏳ PENDING'}
                                </span>
                                {resStatus === 'accepted' && (
  <div className="req-accepted-actions">
    <p className="req-accepted-msg">🎉 Accepted! Start chatting now.</p>
    <button
      className="req-chat-now-btn"
      onClick={() => goToChat(
        req.postedBy?._id,
        req.postedBy?.name,
        req.postedBy?.phone
      )}
    >
      💬 Chat with Receiver
    </button>
  </div>
)}
                              </div>
                            )}
                          </>
                        )}

                        {/* Receiver Actions — view responses to own request */}
                        {user?.role === 'receiver' && isMyRequest && (
                          <button
                            className="req-view-responses-btn"
                            onClick={() => handleViewResponses(req._id)}
                          >
                            {expanded === req._id
                              ? '▲ Hide Responses'
                              : `▼ View Responses (${reqResponses[req._id]?.length || 0})`
                            }
                          </button>
                        )}

                        {/* Not logged in */}
                        {!user && (
                          <button
                            className="req-respond-btn"
                            onClick={() => navigate('/login')}
                          >
                            Login to Respond
                          </button>
                        )}
                      </div>

                      {/* ── Donor Responses (shown to receiver) ── */}
                      {expanded === req._id && (
                        <div className="req-responses-section">
                          <h4>🩸 Donor Responses</h4>
                          {(reqResponses[req._id] || []).length === 0 ? (
                            <p className="req-no-responses">
                              No responses yet. Donors will respond soon.
                            </p>
                          ) : (
                            (reqResponses[req._id] || []).map(res => (
                              <div key={res._id} className="req-donor-response">
                                <div className="req-donor-info">
                                  <div className="req-donor-avatar">
                                    {res.donor?.name?.charAt(0)}
                                  </div>
                                  <div>
                                    <p className="req-donor-name">
                                      {res.donor?.name}
                                    </p>
                                    <p className="req-donor-blood">
                                      🩸 {res.donor?.bloodGroup}
                                    </p>
                                    <p className="req-donor-phone">
                                      📞 {res.donor?.phone}
                                    </p>
                                    <p className="req-donor-city">
                                      📍 {res.donor?.city}
                                    </p>
                                    <p className="req-donor-msg">
                                      "{res.message}"
                                    </p>
                                  </div>
                                </div>
                                <div className="req-donor-actions">
                                  <span
                                    className="req-res-status"
                                    style={{
                                      background:
                                        res.status === 'accepted' ? '#27ae60' :
                                        res.status === 'rejected' ? '#e74c3c' : '#f39c12'
                                    }}
                                  >
                                    {res.status?.toUpperCase()}
                                  </span>
                                  {res.status === 'pending' && (
  <>
    <button
      className="req-accept-btn"
      onClick={() => handleAccept(res._id, req._id, res.donor)}
    >
      ✅ Accept Donor
    </button>
    <button
      className="req-reject-btn"
      onClick={() => handleReject(res._id, req._id)}
    >
      ❌ Reject
    </button>
  </>
)}
                                 {res.status === 'accepted' && (
  <button
    className="req-chat-now-btn"
    onClick={() => goToChat(
      res.donor?._id,
      res.donor?.name,
      res.donor?.phone
    )}
  >
    💬 Chat with Donor
  </button>
)}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── MY RESPONSES TAB (Donor) ── */}
        {activeTab === 'my-responses' && user?.role === 'donor' && (
          <div className="req-my-responses">
            <h3 className="req-section-title">💬 My Responses</h3>
            {myResponses.length === 0 ? (
              <div className="req-empty">
                <p>💬</p>
                <p>You haven't responded to any requests yet</p>
                <button
                  className="req-submit-btn"
                  onClick={() => setActiveTab('all')}
                  style={{ marginTop: '16px' }}
                >
                  Browse Requests
                </button>
              </div>
            ) : (
              <div className="req-responses-list">
                {myResponses.map(res => (
                  <div key={res._id} className="req-my-response-item">
                    <div className="req-my-res-left">
                      <div className="req-blood-circle">
                        {res.request?.bloodGroup || '?'}
                      </div>
                      <div>
                        <p className="req-my-res-city">
                          📍 {res.request?.city || 'Unknown'}
                        </p>
                        <p className="req-my-res-detail">
                          {res.request?.details || 'Blood request'}
                        </p>
                        <p className="req-my-res-urgency">
                          Urgency: {res.request?.urgency}
                        </p>
                        <p className="req-my-res-date">
                          Responded: {new Date(res.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="req-my-res-right">
                      <span
                        className="req-res-status"
                        style={{
                          background:
                            res.status === 'accepted' ? '#27ae60' :
                            res.status === 'rejected' ? '#e74c3c' : '#f39c12'
                        }}
                      >
                        {res.status === 'accepted' ? '✅ ACCEPTED' :
                         res.status === 'rejected' ? '❌ REJECTED' :
                         '⏳ PENDING'}
                      </span>
                      {res.status === 'accepted' && (
                        <div className="req-accepted-actions">
                          <p className="req-accepted-msg">
                            🎉 Your response was accepted!
                          </p>
                          <button
                            className="req-chat-now-btn"
                            onClick={() => navigate('/chat')}
                          >
                            💬 Chat with Receiver Now
                          </button>
                          <p className="req-contact-info">
                            Contact: {res.request?.postedBy?.phone || 'Check chat'}
                          </p>
                        </div>
                      )}
                      {res.status === 'rejected' && (
                        <p className="req-rejected-msg">
                          Not selected for this request
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── MY REQUESTS TAB (Receiver) ── */}
        {activeTab === 'my-requests' && user?.role === 'receiver' && (
          <div className="req-my-responses">
            <h3 className="req-section-title">📋 My Blood Requests</h3>
            {requests.filter(r =>
              r.postedBy?._id === user._id || r.postedBy === user._id
            ).length === 0 ? (
              <div className="req-empty">
                <p>📋</p>
                <p>You haven't posted any requests yet</p>
                <button
                  className="req-submit-btn"
                  onClick={() => setShowForm(true)}
                  style={{ marginTop: '16px' }}
                >
                  Post a Request
                </button>
              </div>
            ) : (
              requests
                .filter(r => r.postedBy?._id === user._id || r.postedBy === user._id)
                .map(req => (
                  <div key={req._id} className="req-my-request-card">
                    <div className="req-my-req-top">
                      <div className="req-my-req-left">
                        <span className="req-blood-circle">{req.bloodGroup}</span>
                        <div>
                          <p className="req-my-res-city">📍 {req.city}</p>
                          <p className="req-my-res-detail">{req.details}</p>
                          <p className="req-my-res-date">
                            {new Date(req.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <span
                          className="req-urgency"
                          style={{ background: urgencyColor(req.urgency) }}
                        >
                          {req.urgency?.toUpperCase()}
                        </span>
                        <span className={`req-req-status ${req.status}`}>
                          {req.status?.toUpperCase()}
                        </span>
                        <button
                          className="req-view-responses-btn"
                          onClick={() => handleViewResponses(req._id)}
                        >
                          {expanded === req._id ? '▲ Hide' : '▼ View Donor Responses'}
                        </button>
                      </div>
                    </div>

                    {/* Responses */}
                    {expanded === req._id && (
                      <div className="req-responses-section">
                        <h4>🩸 Donor Responses</h4>
                        {(reqResponses[req._id] || []).length === 0 ? (
                          <p className="req-no-responses">
                            No donors have responded yet
                          </p>
                        ) : (
                          (reqResponses[req._id] || []).map(res => (
                            <div key={res._id} className="req-donor-response">
                              <div className="req-donor-info">
                                <div className="req-donor-avatar">
                                  {res.donor?.name?.charAt(0)}
                                </div>
                                <div>
                                  <p className="req-donor-name">{res.donor?.name}</p>
                                  <p className="req-donor-blood">
                                    🩸 {res.donor?.bloodGroup}
                                  </p>
                                  <p className="req-donor-phone">
                                    📞 {res.donor?.phone}
                                  </p>
                                  <p className="req-donor-city">
                                    📍 {res.donor?.city}
                                  </p>
                                  <p className="req-donor-msg">
                                    "{res.message}"
                                  </p>
                                </div>
                              </div>
                              <div className="req-donor-actions">
                                <span
                                  className="req-res-status"
                                  style={{
                                    background:
                                      res.status === 'accepted' ? '#27ae60' :
                                      res.status === 'rejected' ? '#e74c3c' : '#f39c12'
                                  }}
                                >
                                  {res.status?.toUpperCase()}
                                </span>
                                {res.status === 'pending' && (
                                  <>
                                    <button
                                      className="req-accept-btn"
                                      onClick={() => handleAccept(res._id, req._id)}
                                    >
                                      ✅ Accept Donor
                                    </button>
                                    <button
                                      className="req-reject-btn"
                                      onClick={() => handleReject(res._id, req._id)}
                                    >
                                      ❌ Reject
                                    </button>
                                  </>
                                )}
                                {res.status === 'accepted' && (
                                  <button
                                    className="req-chat-now-btn"
                                    onClick={() => navigate('/chat')}
                                  >
                                    💬 Chat with Donor
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Requests;