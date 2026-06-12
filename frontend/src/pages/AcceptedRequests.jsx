import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getMyResponses,
  acceptResponse,
  rejectResponse,
  respondToRequest,
  getRequestResponses,
  getBloodRequests
} from '../api/services';
import './AcceptedRequests.css';

const AcceptedRequests = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState(
    user?.role === 'donor' ? 'my-responses' : 'my-requests'
  );
  const [responses, setResponses] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [reqResponses, setReqResponses] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (user.role === 'donor') {
        const res = await getMyResponses();
        setResponses(res.data?.responses || res.data || []);
      } else {
        const res = await getBloodRequests();
        setMyRequests(res.data?.requests || res.data || []);
      }
    } catch (err) {
      console.error('fetchData error:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const handleViewResponses = async (requestId) => {
    if (expanded === requestId) {
      setExpanded(null);
      return;
    }
    try {
      setError('');
      const res = await getRequestResponses(requestId);
      setReqResponses(prev => ({
        ...prev,
        [requestId]: res.data?.responses || res.data || []
      }));
      setExpanded(requestId);
    } catch (err) {
      console.error('handleViewResponses error:', err);
      setError('Failed to load responses');
    }
  };

  const handleRespond = async (requestId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (user.role !== 'donor') {
      setError('Only donors can respond to requests');
      setTimeout(() => setError(''), 3000);
      return;
    }
    try {
      await respondToRequest(requestId, {
        message: 'I am available to donate blood!'
      });
      setSuccess('✅ Response sent! Receiver will contact you if accepted.');
      setTimeout(() => {
        setSuccess('');
        fetchData();
      }, 2000);
    } catch (err) {
      console.error('handleRespond error:', err);
      setError(err.response?.data?.message || 'Failed to respond');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleAccept = async (responseId, requestId) => {
    try {
      await acceptResponse(responseId);
      setSuccess('Donor accepted! Request fulfilled.');
      
      const res = await getRequestResponses(requestId);
      setReqResponses(prev => ({
        ...prev,
        [requestId]: res.data?.responses || res.data || []
      }));
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('handleAccept error:', err);
      setError(err.response?.data?.message || 'Failed to accept');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReject = async (responseId, requestId) => {
    try {
      await rejectResponse(responseId);
      setSuccess('Response rejected');
      
      const res = await getRequestResponses(requestId);
      setReqResponses(prev => ({
        ...prev,
        [requestId]: res.data?.responses || res.data || []
      }));
      
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error('handleReject error:', err);
      setError('Failed to reject');
      setTimeout(() => setError(''), 2000);
    }
  };

  const statusColor = (status) => {
    if (status === 'accepted') return '#27ae60';
    if (status === 'rejected') return '#e74c3c';
    return '#f39c12';
  };

  return (
    <div className="ar-page">
      <header className="ar-navbar">
        <div className="ar-nav-inner">
          <a href="/" className="ar-brand">🩸 BloodBridge</a>
          <div className="ar-nav-right">
            <button className="ar-back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <button
              className="ar-chat-btn"
              onClick={() => navigate('/chat')}
            >
              💬 Open Chat
            </button>
          </div>
        </div>
      </header>

      <div className="ar-container">
        <h1 className="ar-title">
          {user?.role === 'donor' ? '💬 My Responses' : '📋 Request Responses'}
        </h1>

        {success && <div className="ar-success">{success}</div>}
        {error && <div className="ar-error">{error}</div>}

        {/* Tabs */}
        <div className="ar-tabs">
          {user?.role === 'donor' ? (
            <>
              <button
                className={`ar-tab ${activeTab === 'my-responses' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-responses')}
              >
                My Responses
              </button>
              <button
                className={`ar-tab ${activeTab === 'accepted' ? 'active' : ''}`}
                onClick={() => setActiveTab('accepted')}
              >
                ✅ Accepted
              </button>
            </>
          ) : (
            <>
              <button
                className={`ar-tab ${activeTab === 'my-requests' ? 'active' : ''}`}
                onClick={() => setActiveTab('my-requests')}
              >
                My Requests
              </button>
              <button
                className={`ar-tab ${activeTab === 'accepted' ? 'active' : ''}`}
                onClick={() => setActiveTab('accepted')}
              >
                ✅ Fulfilled
              </button>
            </>
          )}
        </div>

        {loading ? (
          <div className="ar-loading">
            <div className="ar-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          <>
            {/* ── Donor: My Responses ── */}
            {user?.role === 'donor' && activeTab === 'my-responses' && (
              <div className="ar-list">
                {responses.length === 0 ? (
                  <div className="ar-empty">
                    <p>💬</p>
                    <p>No responses yet</p>
                    <button
                      className="ar-action-btn"
                      onClick={() => navigate('/requests')}
                    >
                      Browse Requests
                    </button>
                  </div>
                ) : (
                  responses.map((res) => (
                    <div key={res._id} className="ar-item">
                      <div className="ar-item-left">
                        <div className="ar-blood">
                          {res.request?.bloodGroup || res.bloodGroup}
                        </div>
                        <div>
                          <p className="ar-city">📍 {res.request?.city || res.city}</p>
                          <p className="ar-detail">{res.request?.details || res.details}</p>
                          <p className="ar-msg">Your message: {res.message}</p>
                          <p className="ar-date">
                            {new Date(res.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="ar-item-right">
                        <span
                          className="ar-status"
                          style={{ background: statusColor(res.status) }}
                        >
                          {(res.status || 'pending').toUpperCase()}
                        </span>
                        {res.status === 'accepted' && (
                          <button
                            className="ar-chat-now-btn"
                            onClick={() => navigate('/chat')}
                          >
                            💬 Chat with Receiver
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Donor: Accepted ── */}
            {user?.role === 'donor' && activeTab === 'accepted' && (
              <div className="ar-list">
                {responses.filter(r => r.status === 'accepted').length === 0 ? (
                  <div className="ar-empty">
                    <p>✅</p>
                    <p>No accepted responses yet</p>
                  </div>
                ) : (
                  responses.filter(r => r.status === 'accepted').map((res) => (
                    <div key={res._id} className="ar-item accepted">
                      <div className="ar-item-left">
                        <div className="ar-blood accepted-blood">
                          {res.request?.bloodGroup || res.bloodGroup}
                        </div>
                        <div>
                          <p className="ar-city">📍 {res.request?.city || res.city}</p>
                          <p className="ar-detail">{res.request?.details || res.details}</p>
                          <p className="ar-date">
                            Accepted on {new Date(res.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="ar-item-right">
                        <span className="ar-accepted-badge">✅ ACCEPTED</span>
                        <button
                          className="ar-chat-now-btn"
                          onClick={() => navigate('/chat')}
                        >
                          💬 Chat Now
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* ── Receiver: My Requests with Responses ── */}
            {user?.role === 'receiver' && activeTab === 'my-requests' && (
              <div className="ar-list">
                {myRequests.length === 0 ? (
                  <div className="ar-empty">
                    <p>🆘</p>
                    <p>No requests posted yet</p>
                    <button
                      className="ar-action-btn"
                      onClick={() => navigate('/requests')}
                    >
                      Post a Request
                    </button>
                  </div>
                ) : (
                  myRequests.map((req) => (
                    <div key={req._id} className="ar-request-card">
                      <div className="ar-request-top">
                        <div className="ar-item-left">
                          <div className="ar-blood">{req.bloodGroup}</div>
                          <div>
                            <p className="ar-city">📍 {req.city}</p>
                            <p className="ar-detail">{req.details}</p>
                            <p className="ar-date">
                              {new Date(req.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="ar-item-right">
                          <span className={`ar-req-status ${req.status}`}>
                            {(req.status || 'pending').toUpperCase()}
                          </span>
                          <button
                            className="ar-view-responses-btn"
                            onClick={() => handleViewResponses(req._id)}
                          >
                            {expanded === req._id ? '▲ Hide' : '▼ View Responses'}
                          </button>
                        </div>
                      </div>

                      {/* Donor Responses */}
                      {expanded === req._id && (
                        <div className="ar-responses">
                          <h4>Donor Responses:</h4>
                          {(reqResponses[req._id] || []).length === 0 ? (
                            <p className="ar-no-res">No responses yet</p>
                          ) : (
                            (reqResponses[req._id] || []).map((res) => (
                              <div key={res._id} className="ar-donor-response">
                                <div className="ar-donor-left">
                                  <div className="ar-donor-avatar">
                                    {res.donor?.name?.charAt(0) || 'D'}
                                  </div>
                                  <div>
                                    <p className="ar-donor-name">
                                      {res.donor?.name || 'Anonymous Donor'}
                                    </p>
                                    <p className="ar-donor-blood">
                                      🩸 {res.donor?.bloodGroup || 'N/A'}
                                    </p>
                                    <p className="ar-donor-phone">
                                      📞 {res.donor?.phone || 'N/A'}
                                    </p>
                                    <p className="ar-donor-msg">
                                      "{res.message || 'No message'}"
                                    </p>
                                  </div>
                                </div>
                                <div className="ar-donor-actions">
                                  <span
                                    className="ar-status"
                                    style={{ background: statusColor(res.status) }}
                                  >
                                    {res.status || 'pending'}
                                  </span>
                                  {res.status === 'pending' && (
                                    <>
                                      <button
                                        className="ar-accept-btn"
                                        onClick={() => handleAccept(res._id, req._id)}
                                      >
                                        ✅ Accept
                                      </button>
                                      <button
                                        className="ar-reject-btn"
                                        onClick={() => handleReject(res._id, req._id)}
                                      >
                                        ❌ Reject
                                      </button>
                                    </>
                                  )}
                                  {res.status === 'accepted' && (
                                    <button
                                      className="ar-chat-now-btn"
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

            {/* ── Receiver: Fulfilled ── */}
            {user?.role === 'receiver' && activeTab === 'accepted' && (
              <div className="ar-list">
                {myRequests.filter(r => r.status === 'fulfilled').length === 0 ? (
                  <div className="ar-empty">
                    <p>✅</p>
                    <p>No fulfilled requests yet</p>
                  </div>
                ) : (
                  myRequests.filter(r => r.status === 'fulfilled').map((req) => (
                    <div key={req._id} className="ar-item accepted">
                      <div className="ar-item-left">
                        <div className="ar-blood accepted-blood">{req.bloodGroup}</div>
                        <div>
                          <p className="ar-city">📍 {req.city}</p>
                          <p className="ar-detail">{req.details}</p>
                        </div>
                      </div>
                      <div className="ar-item-right">
                        <span className="ar-accepted-badge">✅ FULFILLED</span>
                        <button
                          className="ar-chat-now-btn"
                          onClick={() => navigate('/chat')}
                        >
                          💬 Chat
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AcceptedRequests;