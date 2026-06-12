import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getBookmarks, removeBookmark } from '../api/services';
import './Bookmarks.css';

const Bookmarks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchBookmarks();
  }, [user, navigate]);

  const fetchBookmarks = async () => {
    try {
      setLoading(true);
      const res = await getBookmarks();
      setBookmarks(res.data || []);
    } catch (err) {
      console.error("Failed to fetch bookmarks", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (donorId, donorName) => {
    try {
      await removeBookmark(donorId);
      setBookmarks((prev) => prev.filter((b) => (b.donor?._id || b.donor) !== donorId));
      setSuccess(`Removed ${donorName} from bookmarks`);
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      console.error("Failed to remove bookmark", err);
    }
  };

  const bloodColor = (bg) => {
    const colors = {
      'A+': '#e74c3c', 'A-': '#c0392b', 'B+': '#e67e22', 'B-': '#d35400',
      'AB+': '#8e44ad', 'AB-': '#6c3483', 'O+': '#27ae60', 'O-': '#1e8449'
    };
    return colors[bg] || '#c0392b';
  };

  // Helper to get correct plural form
  const getDonorText = (count) => {
    return count === 1 ? 'donor' : 'donors';
  };

  if (loading && bookmarks.length === 0) {
    return (
      <div className="bm-page">
        <div className="bm-loading">
          <div className="bm-spinner"></div>
          <p>Loading bookmarks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bm-page">
      {/* Navbar */}
      <header className="bm-navbar">
        <div className="bm-nav-inner">
          <Link to="/" className="bm-brand">🩸 BloodBridge</Link>
          <nav className="bm-nav-links">
            <Link to="/">Home</Link>
            <Link to="/donors">Find Donors</Link>
            <Link to="/requests">Requests</Link>
            <Link to="/bookmarks" className="active">Bookmarks</Link>
          </nav>
          <Link to="/receiver/dashboard" className="bm-dash-btn">
            Dashboard
          </Link>
        </div>
      </header>

      <div className="bm-container">
        {/* Header */}
        <div className="bm-header">
          <div>
            <h1 className="bm-title">🔖 Saved Donors</h1>
            <p className="bm-sub">
              {bookmarks.length} {getDonorText(bookmarks.length)} bookmarked
            </p>
          </div>
          <button
            className="bm-find-btn"
            onClick={() => navigate('/donors')}
          >
            + Find More Donors
          </button>
        </div>

        {/* Success Message */}
        {success && <div className="bm-success">{success}</div>}

        {/* Content */}
        {!loading && bookmarks.length === 0 ? (
          <div className="bm-empty">
            <div className="bm-empty-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Save donors so you can quickly find them when needed</p>
            <button className="bm-find-btn" onClick={() => navigate('/donors')}>
              Find Donors
            </button>
          </div>
        ) : (
          <div className="bm-grid">
            {bookmarks.map((bookmark, i) => {
              const donor = bookmark.donor;
              if (!donor) return null;
              const donorId = donor._id || donor;

              return (
                <div key={i} className="bm-card">
                  {/* Card Header */}
                  <div className="bm-card-head">
                    <div
                      className="bm-blood-circle"
                      style={{ background: bloodColor(donor.bloodGroup) }}
                    >
                      {donor.bloodGroup || '?'}
                    </div>
                    <div className="bm-card-info">
                      <h3 className="bm-donor-name">{donor.name}</h3>
                      <p className="bm-donor-city">📍 {donor.city || 'Unknown'}</p>
                    </div>
                    <span className={`bm-avail ${donor.available ? 'yes' : 'no'}`}>
                      {donor.available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Donor Details */}
                  <div className="bm-card-body">
                    <div className="bm-detail-row">
                      <span>📞</span>
                      <span>{donor.phone || 'N/A'}</span>
                    </div>
                    <div className="bm-detail-row">
                      <span>📧</span>
                      <span>{donor.email || 'N/A'}</span>
                    </div>
                    <div className="bm-detail-row">
                      <span>🩸</span>
                      <span>Blood Group: <b>{donor.bloodGroup}</b></span>
                    </div>
                    {donor.healthNote && (
                      <div className="bm-detail-row">
                        <span>📝</span>
                        <span className="bm-health-note">{donor.healthNote}</span>
                      </div>
                    )}
                    <div className="bm-detail-row">
                      <span>🕐</span>
                      <span className="bm-saved-date">
                        Saved {new Date(bookmark.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="bm-card-actions">
                    {donor.phone && (
                      <a href={`tel:${donor.phone}`} className="bm-call-btn">
                        📞 Call Now
                      </a>
                    )}
                    <button
                      className="bm-chat-btn"
                      onClick={() =>
                        navigate(
                          `/chat?userId=${donorId}&name=${encodeURIComponent(
                            donor.name
                          )}&phone=${encodeURIComponent(donor.phone || '')}`
                        )
                      }
                    >
                      💬 Chat
                    </button>
                    <button
                      className="bm-remove-btn"
                      onClick={() => handleRemove(donorId, donor.name)}
                    >
                      🗑️ Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Bookmarks;