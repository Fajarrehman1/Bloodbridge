import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import {
  getNotifications,
  markAllRead,
  markOneRead,
  deleteNotification
} from '../api/services';
import './Notifications.css';

const Notifications = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [notifs,   setNotifs]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [unread,   setUnread]   = useState(0);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchNotifs();
  }, []);

  const fetchNotifs = async () => {
    try {
      const res = await getNotifications();
      setNotifs(res.data);
      setUnread(res.data.filter(n => !n.read).length);
      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    await markAllRead();
    setNotifs(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const handleMarkOne = async (id) => {
    await markOneRead(id);
    setNotifs(prev => prev.map(n =>
      n._id === id ? { ...n, read: true } : n
    ));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifs(prev => prev.filter(n => n._id !== id));
  };

  const typeIcon = (type) => {
    if (type === 'request') return '🩸';
    if (type === 'chat')    return '💬';
    return '🔔';
  };

  return (
    <div className="notif-page">
      <header className="notif-navbar">
        <div className="notif-nav-inner">
          <a href="/" className="notif-brand">🩸 BloodBridge</a>
          <div className="notif-nav-auth">
            <a href={
              user?.role === 'donor'    ? '/donor/dashboard' :
              user?.role === 'receiver' ? '/receiver/dashboard' :
              '/admin/dashboard'
            } className="notif-back-btn">
              ← Dashboard
            </a>
          </div>
        </div>
      </header>

      <div className="notif-container">
        <div className="notif-header">
          <div>
            <h1 className="notif-title">🔔 Notifications</h1>
            {unread > 0 && (
              <span className="notif-unread-badge">
                {unread} unread
              </span>
            )}
          </div>
          {unread > 0 && (
            <button
              className="notif-mark-all-btn"
              onClick={handleMarkAllRead}
            >
              Mark All Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="notif-loading">Loading...</div>
        ) : notifs.length === 0 ? (
          <div className="notif-empty">
            <p>🔔</p>
            <p>No notifications yet</p>
          </div>
        ) : (
          <div className="notif-list">
            {notifs.map(notif => (
              <div
                key={notif._id}
                className={`notif-item ${!notif.read ? 'unread' : ''}`}
              >
                <div className="notif-icon">
                  {typeIcon(notif.type)}
                </div>
                <div className="notif-content">
                  <p className="notif-message">{notif.message}</p>
                  <p className="notif-time">
                    {new Date(notif.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="notif-actions">
                  {!notif.read && (
                    <button
                      className="notif-read-btn"
                      onClick={() => handleMarkOne(notif._id)}
                      title="Mark as read"
                    >
                      ✓
                    </button>
                  )}
                  <button
                    className="notif-delete-btn"
                    onClick={() => handleDelete(notif._id)}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;