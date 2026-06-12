import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './Home.css';
import 'leaflet/dist/leaflet.css';

// --- Leaflet Icon Configuration ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const Home = () => {
  const [currentAlert, setCurrentAlert] = useState(0);

  // --- Alert Data for Alert Bar ---
  const alerts = [
    'URGENT: O- blood needed in Lahore – 2km away',
    'URGENT: A+ blood needed in Karachi – Services Hospital',
    'URGENT: B+ blood needed in Islamabad – PIMS Hospital',
  ];

  // --- Cycle Alert Bar ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentAlert((prev) => (prev + 1) % alerts.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // --- Blood Request Data ---
  const bloodRequests = [
    {
      id: 1,
      bloodGroup: 'O-',
      hospital: 'Shaukat Khanum Hospital, Lahore',
      neededBy: 'Dec 20, 2024',
      email: 'requester@example.com',
      distance: '2km away from you',
      urgency: 'URGENT',
      position: [31.515, 74.355], // Lahore
    },
    {
      id: 2,
      bloodGroup: 'B+',
      hospital: 'CMH Hospital Jhelum Cantt, Jhelum',
      neededBy: 'Dec 10, 2026',
      email: 'requester89@example.com',
      distance: '2km away from you',
      urgency: 'NORMAL',
      position: [32.9336, 73.7264], // Jhelum
    },
    {
      id: 3,
      bloodGroup: 'A+',
      hospital: 'Aga Khan Hospital, Karachi',
      neededBy: 'Dec 22, 2024',
      email: 'patient@example.com',
      distance: '5km away from you',
      urgency: 'NORMAL',
      position: [24.8607, 67.0011], // Karachi
    },
    {
      id: 4,
      bloodGroup: 'B+',
      hospital: 'Civil Hospital, Islamabad',
      neededBy: 'Dec 25, 2024',
      email: 'needblood@example.com',
      distance: '8km away from you',
      urgency: 'NORMAL',
      position: [33.6844, 73.0479], // Islamabad
    },
  ];

  // --- Leaderboard Data ---
  const topDonors = [
    { rank: 1, name: 'Ali Ahmed',    bloodGroup: 'O+', donations: 15, points: 150, achievement: 'Gold Donor' },
    { rank: 2, name: 'Sara Khan',    bloodGroup: 'A+', donations: 12, points: 120, achievement: 'Gold Donor' },
    { rank: 3, name: 'Usman Malik',  bloodGroup: 'B-', donations: 10, points: 100, achievement: 'Certificate Earned' },
    { rank: 4, name: 'Fatima Raza',  bloodGroup: 'AB+', donations: 8, points: 80, achievement: '' },
    { rank: 5, name: 'Bilal Hassan', bloodGroup: 'O-', donations: 7, points: 70, achievement: '' },
  ];

  // --- How It Works Data ---
  const howItWorks = [
    {
      title: 'Register',
      desc: 'Sign up as a donor or receiver with your details and blood type.',
    },
    {
      title: 'Request Blood',
      desc: 'Submit a request for blood with location and urgency details.',
    },
    {
      title: 'Connect',
      desc: 'Get matched with nearby donors or receivers based on blood type.',
    },
  ];

  return (
    <div className="home-page">
      {/* --- Navbar --- */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand">
            <span className="brand-icon">🩸</span>
            <span className="brand-text">BloodBridge</span>
          </div>
          
          <nav className="navbar-menu">
            <a href="/" className="nav-link active">Home</a>
            <a href="/requests" className="nav-link">Requests</a>
            <a href="/donors" className="nav-link">Donors</a>
            <a href="/leaderboard" className="nav-link">Leaderboard</a>
            <a href="/health-reminders" className="nav-link">Health Reminders</a>
            <a href="/health-history" className="nav-link">Health History</a>
            <a href="/blog" className="nav-link">Blog</a>
            <a href="/about" className="nav-link">About</a>
          </nav>

          <div className="navbar-auth">
            <a href="/login" className="btn-login">
              <span>🔑</span> Sign In
            </a>
            <a href="/register" className="btn-register">
              <span>🆕</span> Register
            </a>
          </div>
        </div>
      </header>

      {/* --- Alert Bar --- */}
      <div className="alert-bar">
        <div className="alert-icon">⚠️</div>
        <div className="alert-text">{alerts[currentAlert]}</div>
      </div>

      {/* --- Hero Section --- */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-badge">Lifesaver Community</div>
          <h1>Connect Donors with Those in Need</h1>
          <p>
            Join our community of lifesavers. Whether you can donate blood or need it,
            we're here to help you connect and save lives together.
          </p>
          <div className="hero-btns">
            <a href="/register" className="hero-btn-primary">
              <span>🩸</span> Become a Donor
            </a>
            <a href="/requests" className="hero-btn-secondary">
              <span>📋</span> Request Blood
            </a>
          </div>
          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-number">5,000+</span>
              <span className="stat-label">Donors</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">1,200+</span>
              <span className="stat-label">Lives Saved</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Hospitals</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Blood Request Cards --- */}
      <section className="requests-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Urgent Blood Requests</h2>
            <p className="section-subtitle">Help save lives by responding to urgent requests near you</p>
          </div>
          <div className="requests-grid">
            {bloodRequests.map((req) => (
              <div key={req.id} className={`request-card ${req.urgency === 'URGENT' ? 'urgent-card' : ''}`}>
                <div className="card-header">
                  <div className="blood-group-badge">{req.bloodGroup}</div>
                  {req.urgency === 'URGENT' && (
                    <span className="urgency-badge">URGENT</span>
                  )}
                </div>
                <div className="card-body">
                  <h3 className="card-hospital">{req.hospital}</h3>
                  <div className="card-details">
                    <p className="card-info">
                      <span className="info-icon">📅</span> Needed by: {req.neededBy}
                    </p>
                    <p className="card-info">
                      <span className="info-icon">📧</span> {req.email}
                    </p>
                    <p className="card-info">
                      <span className="info-icon">📍</span> {req.distance}
                    </p>
                  </div>
                </div>
                <a href="/requests" className="respond-btn">
                  <span>🤝</span> Respond to Request
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Map Section --- */}
      <section className="map-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Live Blood Requests Across Pakistan</h2>
            <p className="section-subtitle">Real-time map showing urgent blood requests near you</p>
          </div>

          <div className="map-wrapper">
            <MapContainer
              center={[30.3753, 69.3451]}
              zoom={5}
              style={{ height: '500px', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              {bloodRequests.map((req) => (
                <Marker key={req.id} position={req.position} icon={redIcon}>
                  <Popup>
                    <div className="map-popup">
                      <div className="popup-blood">{req.bloodGroup}</div>
                      <p className="popup-hospital">{req.hospital}</p>
                      <p className="popup-distance">{req.distance}</p>
                      {req.urgency === 'URGENT' && (
                        <span className="popup-urgent">URGENT</span>
                      )}
                      <a href="/requests" className="popup-help-btn">
                        Help Now
                      </a>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Only One Google Maps Link */}
          <div className="map-link-container">
            <a 
              href="https://maps.google.com/?q=Pakistan" 
              target="_blank" 
              rel="noreferrer"
              className="map-full-link"
            >
              📍 View Full Map of Pakistan on Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* --- How It Works --- */}
      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Simple steps to join our lifesaving community</p>
          </div>
          <div className="how-grid">
            {howItWorks.map((item, i) => (
              <div key={i} className="how-card">
                <div className="how-card-icon">0{i + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Leaderboard --- */}
      <section className="leaderboard-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Top Donors Leaderboard</h2>
            <p className="section-subtitle">Celebrating our community heroes</p>
          </div>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>RANK</th>
                <th>DONOR NAME</th>
                <th>BLOOD TYPE</th>
                <th>DONATIONS</th>
                <th>POINTS</th>
                <th>ACHIEVEMENTS</th>
              </tr>
            </thead>
            <tbody>
              {topDonors.map((donor) => (
                <tr key={donor.rank}>
                  <td>
                    <span className={`rank-badge rank-${donor.rank}`}>
                      {donor.rank === 1 ? '🥇' : donor.rank === 2 ? '🥈' : donor.rank === 3 ? '🥉' : donor.rank}
                    </span>
                  </td>
                  <td>{donor.name}</td>
                  <td><span className="blood-type-badge">{donor.bloodGroup}</span></td>
                  <td>{donor.donations}</td>
                  <td>{donor.points}</td>
                  <td>
                    {donor.achievement && (
                      <span className="achievement-badge">{donor.achievement}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>BloodBridge</h3>
            <p>Connecting donors with those in need across Pakistan.</p>
          </div>
          <div className="footer-section">
            <h4>Quick Links</h4>
            <a href="/requests">Blood Requests</a>
            <a href="/donors">Find Donors</a>
            <a href="/about">About Us</a>
          </div>
          <div className="footer-section">
            <h4>Contact</h4>
            <p>📧 info@bloodbridge.com</p>
            <p>📞 +92 300 1234567</p>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 BloodBridge. All rights reserved. | Made with ❤️ in Pakistan</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;