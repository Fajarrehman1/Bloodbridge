import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { useAuth }     from '../context/AuthContext';
import L               from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getBookmarks, addBookmark, removeBookmark } from '../api/services';
import './FindDonors.css';

// Fix leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const redIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
});

const greenIcon = new L.Icon({
  iconUrl:       'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize:      [25, 41],
  iconAnchor:    [12, 41],
  popupAnchor:   [1, -34],
});

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';

const FindDonors = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [donors,        setDonors]        = useState([]);
  const [filtered,      setFiltered]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState('');
  const [mapCenter,     setMapCenter]     = useState([31.5204, 74.3587]);
  const [userLoc,       setUserLoc]       = useState(null);
  const [bloodFilter,   setBloodFilter]   = useState('');
  const [cityFilter,    setCityFilter]    = useState('');
  const [availFilter,   setAvailFilter]   = useState('');
  const [viewMode,      setViewMode]      = useState('list');
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  // ── Fetch donors on mount ────────────────────────────────
  useEffect(() => {
    fetchDonors();
  }, []);

  // ── Load bookmarks when user is receiver ─────────────────
  useEffect(() => {
    if (user?.role === 'receiver') {
      loadBookmarks();
    }
  }, [user]);

  // ── Apply filters whenever donors or filters change ──────
  useEffect(() => {
    applyFilters();
  }, [donors, bloodFilter, cityFilter, availFilter]);

  // ── Fetch all donors from backend ─────────────────────────
  const fetchDonors = async () => {
    try {
      setLoading(true);
      setError('');

      const token = JSON.parse(
        localStorage.getItem('bloodbridge_user')
      )?.token;

      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const res  = await fetch(`${BACKEND}/api/donors`, { headers });
      const data = await res.json();

      console.log('Donors fetched:', data);

      const list = Array.isArray(data)
        ? data
        : (data.donors || data.data || []);

      setDonors(list);
      setFiltered(list);
      setLoading(false);
    } catch (err) {
      console.error('fetchDonors error:', err);
      setError('Failed to load donors. Make sure backend is running.');
      setLoading(false);
    }
  };

  // ── Load bookmarks ────────────────────────────────────────
  const loadBookmarks = async () => {
    try {
      const res = await getBookmarks();
      const ids = res.data.map(b => String(b.donor?._id || b.donor));
      setBookmarkedIds(ids);
    } catch (e) {
      console.error('loadBookmarks error:', e);
    }
  };

  // ── Apply filters ─────────────────────────────────────────
  const applyFilters = () => {
    let result = [...donors];
    if (bloodFilter) {
      result = result.filter(d => d.bloodGroup === bloodFilter);
    }
    if (cityFilter) {
      result = result.filter(d =>
        d.city?.toLowerCase().includes(cityFilter.toLowerCase())
      );
    }
    if (availFilter === 'available') {
      result = result.filter(d => d.available);
    }
    if (availFilter === 'unavailable') {
      result = result.filter(d => !d.available);
    }
    setFiltered(result);
  };

  // ── Handle bookmark toggle ────────────────────────────────
  const handleBookmark = async (donor) => {
    if (!user) { navigate('/login'); return; }
    const donorId = String(donor._id);
    try {
      if (bookmarkedIds.includes(donorId)) {
        await removeBookmark(donorId);
        setBookmarkedIds(prev => prev.filter(id => id !== donorId));
      } else {
        await addBookmark(donorId);
        setBookmarkedIds(prev => [...prev, donorId]);
      }
    } catch (err) {
      console.error('Bookmark error:', err.response?.data || err);
    }
  };

  // ── Location helpers ──────────────────────────────────────
  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      const loc = [pos.coords.latitude, pos.coords.longitude];
      setUserLoc(loc);
      setMapCenter(loc);
    });
  };

  const useLahore = () => {
    const loc = [31.5204, 74.3587];
    setMapCenter(loc);
    setUserLoc(loc);
  };

  const clearFilters = () => {
    setBloodFilter('');
    setCityFilter('');
    setAvailFilter('');
  };

  const bloodColor = (bg) => {
    const colors = {
      'A+': '#e74c3c', 'A-': '#c0392b',
      'B+': '#e67e22', 'B-': '#d35400',
      'AB+':'#8e44ad', 'AB-':'#6c3483',
      'O+': '#27ae60', 'O-': '#1e8449'
    };
    return colors[bg] || '#c0392b';
  };

  const isBookmarked = (donorId) =>
    bookmarkedIds.includes(String(donorId));

  // ── Render ────────────────────────────────────────────────
  return (
    <div className="fd-page">

      {/* Navbar */}
      <header className="fd-navbar">
        <div className="fd-nav-inner">
          <a href="/" className="fd-brand">🩸 BloodBridge</a>
          <nav className="fd-nav-links">
            <a href="/">Home</a>
            <a href="/requests">Requests</a>
            <a href="/donors" className="active">Donors</a>
            <a href="/blog">Blog</a>
          </nav>
          <div className="fd-nav-auth">
           {user ? (
  <a
    href={
      user.role === 'donor'
        ? '/donor/dashboard'
        : user.role === 'receiver'
        ? '/receiver/dashboard'
        : '/admin/dashboard'
    }
    className="fd-dashboard-btn"
  >
    Dashboard
  </a>
            ) : (
              <>
                <a href="/login"    className="fd-signin">Sign In</a>
                <a href="/register" className="fd-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="fd-hero">
        <h1>🩸 Find Blood Donors</h1>
        <p>
          {loading ? 'Loading donors...' : `${filtered.length} donors available`}
          {bloodFilter ? ` with ${bloodFilter}` : ''}
          {cityFilter  ? ` in ${cityFilter}`   : ''}
        </p>
      </div>

      <div className="fd-container">

        {/* Error Banner */}
        {error && (
          <div className="fd-error-banner">
            ❌ {error}
            <button onClick={fetchDonors} className="fd-retry-btn">
              Retry
            </button>
          </div>
        )}

        {/* Filters Card */}
        <div className="fd-filters-card">
          <div className="fd-filters">
            <div className="fd-filter-group">
              <label>🩸 Blood Group</label>
              <select
                value={bloodFilter}
                onChange={e => setBloodFilter(e.target.value)}
              >
                <option value="">All Blood Groups</option>
                {BLOOD_GROUPS.map(bg => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
            </div>

            <div className="fd-filter-group">
              <label>📍 City</label>
              <input
                placeholder="Lahore, Karachi..."
                value={cityFilter}
                onChange={e => setCityFilter(e.target.value)}
              />
            </div>

            <div className="fd-filter-group">
              <label>✅ Availability</label>
              <select
                value={availFilter}
                onChange={e => setAvailFilter(e.target.value)}
              >
                <option value="">All</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <button className="fd-clear-btn" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>

          {/* View Toggle */}
          <div className="fd-view-toggle">
            <button
              className={`fd-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              📋 List View
            </button>
            <button
              className={`fd-toggle-btn ${viewMode === 'map' ? 'active' : ''}`}
              onClick={() => setViewMode('map')}
            >
              🗺️ Map View
            </button>
            <button
              className={`fd-toggle-btn ${viewMode === 'both' ? 'active' : ''}`}
              onClick={() => setViewMode('both')}
            >
              📋+🗺️ Both
            </button>
          </div>
        </div>

        {/* Blood Group Quick Filter */}
        <div className="fd-blood-quick">
          <button
            className={`fd-blood-btn ${bloodFilter === '' ? 'active' : ''}`}
            onClick={() => setBloodFilter('')}
          >
            All
          </button>
          {BLOOD_GROUPS.map(bg => (
            <button
              key={bg}
              className={`fd-blood-btn ${bloodFilter === bg ? 'active' : ''}`}
              style={bloodFilter === bg ? { background: bloodColor(bg), color: 'white', borderColor: 'transparent' } : {}}
              onClick={() => setBloodFilter(bloodFilter === bg ? '' : bg)}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="fd-stats-bar">
          <div className="fd-stat-item">
            <span className="fd-stat-num">{donors.length}</span>
            <span className="fd-stat-lbl">Total Donors</span>
          </div>
          <div className="fd-stat-item">
            <span className="fd-stat-num">
              {donors.filter(d => d.available).length}
            </span>
            <span className="fd-stat-lbl">Available Now</span>
          </div>
          <div className="fd-stat-item">
            <span className="fd-stat-num">{filtered.length}</span>
            <span className="fd-stat-lbl">Matching</span>
          </div>
          <div className="fd-stat-item">
            <span className="fd-stat-num">
              {[...new Set(donors.map(d => d.city).filter(Boolean))].length}
            </span>
            <span className="fd-stat-lbl">Cities</span>
          </div>
        </div>

        {/* MAP VIEW */}
        {(viewMode === 'map' || viewMode === 'both') && (
          <div className="fd-map-section">
            <div className="fd-map-controls">
              <button className="fd-loc-btn" onClick={useMyLocation}>
                📍 Use My Location
              </button>
              <button className="fd-loc-btn green" onClick={useLahore}>
                🏠 Lahore Default
              </button>
            </div>
            <div className="fd-map-wrap">
              <MapContainer
                center={mapCenter}
                zoom={12}
                style={{ height: '400px', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap contributors'
                />
                {userLoc && (
                  <>
                    <Marker position={userLoc} icon={greenIcon}>
                      <Popup>📍 Your Location</Popup>
                    </Marker>
                    <Circle
                      center={userLoc}
                      radius={5000}
                      color="#c0392b"
                      fillOpacity={0.08}
                    />
                  </>
                )}
                {filtered
                  .filter(d => d.location?.coordinates)
                  .map((donor, i) => (
                    <Marker
                      key={i}
                      position={[
                        donor.location.coordinates[1],
                        donor.location.coordinates[0]
                      ]}
                      icon={redIcon}
                    >
                      <Popup>
                        <div style={{ minWidth: 160 }}>
                          <b style={{ color: '#c0392b' }}>{donor.bloodGroup}</b>
                          <p><b>{donor.name}</b></p>
                          <p>📍 {donor.city}</p>
                          <p>📞 {donor.phone}</p>
                          <p style={{
                            color: donor.available ? '#27ae60' : '#e74c3c'
                          }}>
                            {donor.available ? '✅ Available' : '❌ Unavailable'}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  ))
                }
              </MapContainer>
            </div>
          </div>
        )}

        {/* LIST VIEW */}
        {(viewMode === 'list' || viewMode === 'both') && (
          <div className="fd-list-section">
            <div className="fd-list-header">
              <h2>
                {loading
                  ? 'Loading donors...'
                  : filtered.length > 0
                    ? `Showing ${filtered.length} Donors`
                    : 'No donors found'}
              </h2>
              <button
                className="fd-refresh-btn"
                onClick={fetchDonors}
                disabled={loading}
              >
                🔄 Refresh
              </button>
            </div>

            {loading ? (
              <div className="fd-loading">
                <div className="fd-spinner"></div>
                <p>Loading donors...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="fd-empty">
                <p>😔</p>
                <p>No donors found</p>
                <button className="fd-clear-btn" onClick={clearFilters}>
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="fd-grid">
                {filtered.map((donor, i) => (
                  <div
                    key={donor._id || i}
                    className={`fd-card ${donor.available ? 'available' : 'unavailable'}`}
                  >
                    {/* Card Header */}
                    <div className="fd-card-head">
                      <h3
  className="fd-donor-name"
  style={{ cursor: 'pointer' }}
  onClick={() => navigate(`/donor/${donor._id}`)}
>
  {donor.name} →
</h3>
                      <div
                        className="fd-blood-circle"
                        style={{ background: bloodColor(donor.bloodGroup) }}
                      >
                        {donor.bloodGroup}
                      </div>
                      <div className="fd-card-title">
                        <h3 className="fd-donor-name">{donor.name}</h3>
                        <p className="fd-donor-city">
                          📍 {donor.city || 'Unknown'}
                        </p>
                      </div>
                      <span className={`fd-avail-badge ${donor.available ? 'yes' : 'no'}`}>
                        {donor.available ? '✅ Available' : '❌ Unavailable'}
                      </span>
                    </div>

                    {/* Card Body */}
                    <div className="fd-card-body">
                      <div className="fd-info-row">
                        <span className="fd-info-icon">📞</span>
                        <span>{donor.phone || 'N/A'}</span>
                      </div>
                      <div className="fd-info-row">
                        <span className="fd-info-icon">🩸</span>
                        <span>Blood Group: <b>{donor.bloodGroup}</b></span>
                      </div>
                      <div className="fd-info-row">
                        <span className="fd-info-icon">📍</span>
                        <span>{donor.city || 'Not specified'}</span>
                      </div>
                      {donor.healthNote && (
                        <div className="fd-info-row">
                          <span className="fd-info-icon">📝</span>
                          <span className="fd-health-note">
                            {donor.healthNote}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Card Actions */}
                    <div className="fd-card-actions">
                      {donor.available ? (
                        <>
                          {/* Call button */}
<a
  href={`tel:${donor.phone}`}
  className="fd-call-btn"
>
  📞 Call
</a>

                          {/* Bookmark — receivers only */}
                          {user?.role === 'receiver' && (
                            <button
                              className={`fd-bookmark-btn ${isBookmarked(donor._id) ? 'bookmarked' : ''}`}
                              onClick={() => handleBookmark(donor)}
                              title={isBookmarked(donor._id)
                                ? 'Remove from bookmarks'
                                : 'Save donor'}
                            >
                              {isBookmarked(donor._id) ? '🔖 Saved' : '🔖 Save'}
                            </button>
                          )}

                          {/* Chat */}
                          {user ? (
                            <button
                              className="fd-chat-btn"
                              onClick={() => navigate(
                                `/chat?userId=${donor._id}&name=${encodeURIComponent(donor.name)}&phone=${encodeURIComponent(donor.phone || '')}`
                              )}
                            >
                              💬 Chat
                            </button>
                          ) : (
                            <button
                              className="fd-chat-btn"
                              onClick={() => navigate('/login')}
                            >
                              Login to Chat
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="fd-unavail-msg">
                          Currently unavailable for donation
                        </div>
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

export default FindDonors;