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
  rejectResponse,
  confirmDonation,
  getMyRequests
} from '../api/services';
import './Requests.css';

const Requests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [requests, setRequests] = useState([]);
  const [myResponses, setMyResponses] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState({ bloodGroup: '', urgency: '', city: '' });
  const [showThankYou, setShowThankYou] = useState(false);
  const [form, setForm] = useState({
    bloodGroup: '', city: '', urgency: 'urgent', details: ''
  });

  const [showConfirmModal,   setShowConfirmModal]   = useState(false);
  const [confirmingResponse, setConfirmingResponse] = useState(null);
  const [confirmingRequestId,setConfirmingRequestId]= useState(null);
  const [hospitalInput,      setHospitalInput]      = useState('');
  const [confirmLoading,     setConfirmLoading]     = useState(false);
  const [expanded,     setExpanded]     = useState(null);
  const [reqResponses, setReqResponses] = useState({});

  useEffect(() => {
    fetchRequests();
    if (user) {
      fetchMyData();
      if (user.role === 'receiver') fetchMyRequests();
    }
  }, [filter, user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filter.bloodGroup) params.bloodGroup = filter.bloodGroup;
      if (filter.urgency)    params.urgency    = filter.urgency;
      if (filter.city)       params.city       = filter.city;
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

  const fetchMyRequests = async () => {
    try {
      const res = await getMyRequests();
      setMyRequests(res.data || []);
    } catch (err) {
      console.error('fetchMyRequests error:', err);
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
      if (user.role === 'receiver') fetchMyRequests();
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
    if (expanded === requestId) { setExpanded(null); return; }
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
      if (user.role === 'receiver') fetchMyRequests();
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
    } catch (err) {
      setError('Failed to reject');
    }
  };

  const goToChat = (userId, name, phone) => {
    if (!userId) { alert('User information not available'); return; }
    navigate(
      `/chat?userId=${encodeURIComponent(userId)}&name=${encodeURIComponent(name || 'User')}&phone=${encodeURIComponent(phone || '')}`
    );
  };

  const openConfirmModal = (response, requestId) => {
    setConfirmingResponse(response);
    setConfirmingRequestId(requestId);
    setHospitalInput('');
    setShowConfirmModal(true);
  };

const handleConfirmDonation = async () => {
  if (!confirmingResponse) return;
  try {
    setConfirmLoading(true);
    const result = await confirmDonation(confirmingResponse._id, hospitalInput);

    // Show thank you and close modal
    setShowConfirmModal(false);
    setConfirmLoading(false);
    setShowThankYou(true);

    // Refresh data
    if (confirmingRequestId) {
      const updated = await getRequestResponses(confirmingRequestId);
      setReqResponses(prev => ({
        ...prev,
        [confirmingRequestId]: updated.data.responses || []
      }));
    }
    fetchRequests();
    if (user?.role === 'receiver') fetchMyRequests();

    // Auto-hide thank you after 4 seconds
    setTimeout(() => setShowThankYou(false), 4000);
  } catch (err) {
    setError(err.response?.data?.message || 'Failed to confirm donation');
    setTimeout(() => setError(''), 3000);
    setConfirmLoading(false);
  }
};

  const urgencyColor = (u) => {
    if (u === 'critical') return '#c0392b';
    if (u === 'urgent')   return '#e67e22';
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

  // ── Reusable donor response card (used in both tabs) ──────
  const renderDonorResponse = (res, req) => (
    <div key={res._id} className="req-donor-response">
      <div className="req-donor-info">
        <div className="req-donor-avatar">
          {res.donor?.name?.charAt(0)}
        </div>
        <div>
          <p className="req-donor-name">{res.donor?.name}</p>
          <p className="req-donor-blood">🩸 {res.donor?.bloodGroup}</p>
          <p className="req-donor-phone">📞 {res.donor?.phone}</p>
          <p className="req-donor-city">📍 {res.donor?.city}</p>
          <p className="req-donor-msg">"{res.message}"</p>
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
          <>
            <button
              className="req-chat-now-btn"
              onClick={() => goToChat(res.donor?._id, res.donor?.name, res.donor?.phone)}
            >
              💬 Chat with Donor
            </button>

            {!res.donationConfirmed ? (
              <div className="req-confirm-box">
                <p className="req-confirm-text">
                  🩸 Did <strong>{res.donor?.name}</strong> complete the donation?
                </p>
                <button
                  className="req-confirm-btn"
                  onClick={() => openConfirmModal(res, req._id)}
                >
                  ✅ Confirm Blood Received
                </button>
              </div>
            ) : (
              <div className="req-confirmed-badge">
                ✅ Donation confirmed on{' '}
                {new Date(res.donationConfirmedAt).toLocaleDateString()}
                {res.hospitalName && ` at ${res.hospitalName}`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  return (
    <div className="req-page">

      {/* ── Navbar ── */}
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
                <button className="req-chat-nav-btn" onClick={() => navigate('/chat')}>
                  💬 Chat
                </button>
                <a
                  href={
                    user.role === 'donor'    ? '/donor/dashboard'    :
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
                <a href="/login"    className="req-signin">Sign In</a>
                <a href="/register" className="req-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="req-container">

        {/* ── Page Header ── */}
        <div className="req-header">
          <div>
            <h1 className="req-title">🆘 Blood Requests</h1>
            <p className="req-sub">Find urgent blood requests near you</p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            {user && (
              <button className="req-chat-btn" onClick={() => navigate('/chat')}>
                💬 Chat
              </button>
            )}
            <button
              className="req-post-btn"
              onClick={() => { if (!user) navigate('/login'); else setShowForm(!showForm); }}
            >
              + Post Request
            </button>
          </div>
        </div>

        {/* ── Alerts ── */}
        {error   && <div className="req-error">❌ {error}</div>}
        {success && <div className="req-success">{success}</div>}

        {/* ── Tabs ── */}
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
                onClick={() => { setActiveTab('my-requests'); fetchMyRequests(); }}
              >
                📋 My Requests ({myRequests.length})
              </button>
            )}
          </div>
        )}

        {/* ── Post Request Form ── */}
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
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
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
                <button type="button" className="req-cancel-btn" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ════════════════════════════════════
            TAB 1 — ALL REQUESTS
        ════════════════════════════════════ */}
        {activeTab === 'all' && (
          <>
            <div className="req-filters">
              <select
                value={filter.bloodGroup}
                onChange={e => setFilter({ ...filter, bloodGroup: e.target.value })}
                className="req-filter-select"
              >
                <option value="">All Blood Groups</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
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
                  const responded  = alreadyResponded(req._id);
                  const resStatus  = myResponseStatus(req._id);
                  const isMyRequest = String(req.postedBy?._id || req.postedBy) === String(user?._id);
                  const myResponseObj = myResponses.find(
                    r => r.request?._id === req._id || r.request === req._id
                  );

                  return (
                    <div key={req._id} className="req-card">
                      <div className="req-card-top">
                        <span className="req-blood">{req.bloodGroup}</span>
                        <span className="req-urgency" style={{ background: urgencyColor(req.urgency) }}>
                          {req.urgency?.toUpperCase()}
                        </span>
                      </div>

                      <div className="req-card-body">
                        <p className="req-city">📍 {req.city}</p>
                        {req.details && <p className="req-details">{req.details}</p>}
                        <p className="req-posted-by">👤 {req.postedBy?.name || 'Anonymous'}</p>
                        <p className="req-phone">📞 {req.postedBy?.phone || 'N/A'}</p>
                        <p className="req-date">🕐 {new Date(req.createdAt).toLocaleDateString()}</p>
                      </div>

                      <div className="req-card-actions">
                        {/* Donor side */}
                        {user?.role === 'donor' && !isMyRequest && (
                          <>
                            {!responded ? (
                              <button className="req-respond-btn" onClick={() => handleRespond(req._id)}>
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
                                   resStatus === 'rejected' ? '❌ REJECTED' : '⏳ PENDING'}
                                </span>
                                {resStatus === 'accepted' && (
                                  <div className="req-accepted-actions">
                                    <p className="req-accepted-msg">🎉 Accepted! Start chatting now.</p>
                                    <button
                                      className="req-chat-now-btn"
                                      onClick={() => goToChat(req.postedBy?._id, req.postedBy?.name, req.postedBy?.phone)}
                                    >
                                      💬 Chat with Receiver
                                    </button>
                                    {myResponseObj?.donationConfirmed ? (
                                      <div className="req-confirmed-badge">
                                        ✅ Donation confirmed{' '}
                                        {myResponseObj.hospitalName && `at ${myResponseObj.hospitalName}`}
                                        {' '}— you earned 10 points! 🏆
                                      </div>
                                    ) : (
                                      <div className="req-waiting-confirm-badge">
                                        ⏳ Waiting for receiver to confirm donation
                                      </div>
                                    )}
                                  </div>
                                )}
                                {/* ── Thank You Popup ── */}
{showThankYou && (
  <div className="ty-overlay">
    <div className="ty-box">
      <div className="ty-icon">🎉</div>
      <h2>Thank You!</h2>
      <p>
        Donation confirmed successfully!<br />
        The donor has been awarded <strong>10 points</strong>.<br />
        They now appear on the leaderboard. 🏆
      </p>
      <button
        className="ty-btn"
        onClick={() => setShowThankYou(false)}
      >
        ✅ Done
      </button>
    </div>
  </div>
)}
                              </div>
                            )}
                          </>
                        )}

                        {/* Receiver side — in All Requests tab */}
                        {user?.role === 'receiver' && isMyRequest && (
                          <button
                            className="req-view-responses-btn"
                            onClick={() => handleViewResponses(req._id)}
                          >
                            {expanded === req._id
                              ? '▲ Hide Responses'
                              : `▼ View Responses (${reqResponses[req._id]?.length || 0})`}
                          </button>
                        )}

                        {!user && (
                          <button className="req-respond-btn" onClick={() => navigate('/login')}>
                            Login to Respond
                          </button>
                        )}
                      </div>

                      {expanded === req._id && (
                        <div className="req-responses-section">
                          <h4>🩸 Donor Responses</h4>
                          {(reqResponses[req._id] || []).length === 0 ? (
                            <p className="req-no-responses">No responses yet.</p>
                          ) : (
                            (reqResponses[req._id] || []).map(res => renderDonorResponse(res, req))
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

        {/* ════════════════════════════════════
            TAB 2 — MY RESPONSES (Donor)
        ════════════════════════════════════ */}
        {activeTab === 'my-responses' && user?.role === 'donor' && (
          <div className="req-my-responses">
            <h3 className="req-section-title">💬 My Responses</h3>
            {myResponses.length === 0 ? (
              <div className="req-empty">
                <p>💬</p>
                <p>You haven't responded to any requests yet</p>
                <button className="req-submit-btn" onClick={() => setActiveTab('all')} style={{ marginTop: '16px' }}>
                  Browse Requests
                </button>
              </div>
            ) : (
              <div className="req-responses-list">
                {myResponses.map(res => (
                  <div key={res._id} className="req-my-response-item">
                    <div className="req-my-res-left">
                      <div className="req-blood-circle">{res.request?.bloodGroup || '?'}</div>
                      <div>
                        <p className="req-my-res-city">📍 {res.request?.city || 'Unknown'}</p>
                        <p className="req-my-res-detail">{res.request?.details || 'Blood request'}</p>
                        <p className="req-my-res-urgency">Urgency: {res.request?.urgency}</p>
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
                         res.status === 'rejected' ? '❌ REJECTED' : '⏳ PENDING'}
                      </span>
                      {res.status === 'accepted' && (
                        <div className="req-accepted-actions">
                          <p className="req-accepted-msg">🎉 Your response was accepted!</p>
                          <button className="req-chat-now-btn" onClick={() => navigate('/chat')}>
                            💬 Chat with Receiver Now
                          </button>
                          <p className="req-contact-info">
                            Contact: {res.request?.postedBy?.phone || 'Check chat'}
                          </p>
                          {res.donationConfirmed ? (
                            <div className="req-confirmed-badge">
                              ✅ Donation confirmed — you earned 10 points! 🏆
                            </div>
                          ) : (
                            <div className="req-waiting-confirm-badge">
                              ⏳ Waiting for receiver to confirm donation
                            </div>
                          )}
                        </div>
                      )}
                      {res.status === 'rejected' && (
                        <p className="req-rejected-msg">Not selected for this request</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            TAB 3 — MY REQUESTS (Receiver)
            Uses dedicated API — shows ALL statuses
        ════════════════════════════════════ */}
        {activeTab === 'my-requests' && user?.role === 'receiver' && (
          <div className="req-my-responses">
            <h3 className="req-section-title">📋 My Blood Requests</h3>

            {myRequests.length === 0 ? (
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
              myRequests.map(req => (
                <div key={req._id} className="req-my-request-card">
                  <div className="req-my-req-top">
                    <div className="req-my-req-left">
                      <span className="req-blood-circle">{req.bloodGroup}</span>
                      <div>
                        <p className="req-my-res-city">📍 {req.city}</p>
                        <p className="req-my-res-detail">{req.details}</p>
                        <p className="req-my-res-date">
                          Posted: {new Date(req.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                      <span className="req-urgency" style={{ background: urgencyColor(req.urgency) }}>
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

                  {/* Donor responses with confirm button */}
                  {expanded === req._id && (
                    <div className="req-responses-section">
                      <h4>🩸 Donor Responses</h4>
                      {(reqResponses[req._id] || []).length === 0 ? (
                        <p className="req-no-responses">No donors have responded yet</p>
                      ) : (
                        (reqResponses[req._id] || []).map(res => renderDonorResponse(res, req))
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

      </div>

      {/* ── Donation Confirmation Modal ── */}
      {showConfirmModal && confirmingResponse && (
        <div className="cd-overlay" onClick={() => setShowConfirmModal(false)}>
          <div className="cd-modal" onClick={e => e.stopPropagation()}>
            <h3>✅ Confirm Blood Donation</h3>
            <p>
              Confirm that <strong>{confirmingResponse.donor?.name}</strong> donated{' '}
              <strong>{confirmingResponse.donor?.bloodGroup}</strong> blood and it was
              received at the hospital.
            </p>
            <div className="cd-warning">
              ⚠️ This cannot be undone. The donor will receive 10 points and this will
              count toward their leaderboard ranking.
            </div>
            <label className="cd-label">Hospital Name (optional)</label>
            <input
              className="cd-input"
              placeholder="e.g. Jinnah Hospital Lahore"
              value={hospitalInput}
              onChange={e => setHospitalInput(e.target.value)}
            />
            <div className="cd-btns">
              <button
                className="cd-confirm-btn"
                onClick={handleConfirmDonation}
                disabled={confirmLoading}
              >
                {confirmLoading ? 'Confirming...' : '✅ Yes, Confirm Donation'}
              </button>
              <button
                className="cd-cancel-btn"
                onClick={() => setShowConfirmModal(false)}
                disabled={confirmLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Requests;