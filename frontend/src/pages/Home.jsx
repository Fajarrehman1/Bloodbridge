import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
} from 'react-leaflet';
import L from 'leaflet';

import {
  getBloodRequests,
  getLeaderboard,
} from '../api/services';

import './Home.css';
import 'leaflet/dist/leaflet.css';

// =========================================================
// LEAFLET ICON CONFIGURATION
// =========================================================

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',

  iconRetinaUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',

  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const redIcon = L.icon({
  iconUrl:
    'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',

  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',

  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// =========================================================
// CITY COORDINATES
// Used only for displaying real requests on Leaflet
// =========================================================

const cityCoordinates = {
  Lahore: [31.5204, 74.3587],
  Karachi: [24.8607, 67.0011],
  Islamabad: [33.6844, 73.0479],
  Jhelum: [32.9405, 73.7276],
  Rawalpindi: [33.5651, 73.0169],
  Multan: [30.1575, 71.5249],
  Peshawar: [34.0151, 71.5249],
  Faisalabad: [31.4504, 73.135],
  Gujranwala: [32.1877, 74.1945],
  Sialkot: [32.4945, 74.5229],
  Quetta: [30.1798, 66.975],
};

// =========================================================
// HOME COMPONENT
// =========================================================

const Home = () => {
  const [currentAlert, setCurrentAlert] = useState(0);

  const [bloodRequests, setBloodRequests] = useState([]);

  const [topDonors, setTopDonors] = useState([]);

  const [loadingRequests, setLoadingRequests] =
    useState(true);

  const [loadingLeaderboard, setLoadingLeaderboard] =
    useState(true);

  const [requestError, setRequestError] =
    useState('');

  const [leaderboardError, setLeaderboardError] =
    useState('');

  // =========================================================
  // HOW IT WORKS
  // =========================================================

  const howItWorks = [
    {
      title: 'Register',
      desc:
        'Sign up as a donor or receiver with your details and blood type.',
    },
    {
      title: 'Request Blood',
      desc:
        'Submit a request for blood with location and urgency details.',
    },
    {
      title: 'Connect',
      desc:
        'Get matched with nearby donors or receivers based on blood type.',
    },
  ];

  // =========================================================
  // FETCH REAL BLOOD REQUESTS
  // =========================================================

  useEffect(() => {
    fetchHomeRequests();
    fetchHomeLeaderboard();
  }, []);

  const fetchHomeRequests = async () => {
    try {
      setLoadingRequests(true);
      setRequestError('');

      const res = await getBloodRequests({});

      const data = Array.isArray(res.data)
        ? res.data
        : [];

      /*
        Put critical and urgent requests first,
        then show the newest requests.
      */

      const urgencyOrder = {
        critical: 1,
        urgent: 2,
        normal: 3,
      };

      const sorted = [...data].sort((a, b) => {
        const urgencyA =
          urgencyOrder[a.urgency] || 4;

        const urgencyB =
          urgencyOrder[b.urgency] || 4;

        if (urgencyA !== urgencyB) {
          return urgencyA - urgencyB;
        }

        return (
          new Date(b.createdAt) -
          new Date(a.createdAt)
        );
      });

      setBloodRequests(sorted);

      setLoadingRequests(false);
    } catch (err) {
      console.error(
        'Home requests fetch error:',
        err
      );

      setRequestError(
        'Failed to load blood requests'
      );

      setLoadingRequests(false);
    }
  };

  // =========================================================
  // FETCH REAL LEADERBOARD
  // =========================================================

  const fetchHomeLeaderboard = async () => {
    try {
      setLoadingLeaderboard(true);
      setLeaderboardError('');

      const res = await getLeaderboard({});

      const data = res.data;

      const list =
        data?.leaderboard || [];

      const mapped = list.map((d, i) => ({
        rank: d.rank || i + 1,

        _id: d._id,

        name:
          d.name || 'Blood Donor',

        bloodGroup:
          d.bloodGroup || 'N/A',

        city:
          d.city || '',

        donations:
          d.donations || 0,

        points:
          d.points || 0,

        level:
          d.level,

        achievement:
          d.achievement || '',

        badge:
          i === 0
            ? '🥇'
            : i === 1
              ? '🥈'
              : i === 2
                ? '🥉'
                : '⭐',
      }));

      setTopDonors(mapped);

      setLoadingLeaderboard(false);
    } catch (err) {
      console.error(
        'Home leaderboard fetch error:',
        err
      );

      setLeaderboardError(
        'Failed to load leaderboard'
      );

      setLoadingLeaderboard(false);
    }
  };

  // =========================================================
  // REAL URGENT ALERTS
  // =========================================================

  const urgentRequests =
    bloodRequests.filter(
      (req) =>
        req.urgency === 'urgent' ||
        req.urgency === 'critical'
    );

  const alerts =
    urgentRequests.length > 0
      ? urgentRequests.map((req) => {
          const urgency =
            req.urgency === 'critical'
              ? 'CRITICAL'
              : 'URGENT';

          return `${urgency}: ${req.bloodGroup} blood needed in ${req.city}${
            req.details
              ? ` – ${req.details}`
              : ''
          }`;
        })
      : [
          'BloodBridge — Connecting donors with people in need across Pakistan',
        ];

  // =========================================================
  // ALERT BAR TIMER
  // =========================================================

  useEffect(() => {
    setCurrentAlert(0);

    if (alerts.length <= 1) {
      return undefined;
    }

    const timer = setInterval(() => {
      setCurrentAlert(
        (prev) =>
          (prev + 1) % alerts.length
      );
    }, 3000);

    return () =>
      clearInterval(timer);
  }, [alerts.length]);

  // =========================================================
  // REQUESTS TO SHOW ON HOME
  // =========================================================

  /*
    Home page should not become too long.
    Show the first 4 real requests.
  */

  const homeRequests =
    bloodRequests.slice(0, 4);

  // =========================================================
  // TOP DONORS TO SHOW
  // =========================================================

  const homeTopDonors =
    topDonors.slice(0, 5);

  // =========================================================
  // MAP REQUESTS
  // =========================================================

  /*
    The request model currently provides city,
    but Home.jsx previously used hard-coded coordinates.

    We convert known Pakistani cities into coordinates
    only for displaying those real requests on the map.
  */

  const mapRequests =
    bloodRequests
      .map((req) => {
        const cityName =
          req.city?.trim();

        const matchingCity =
          Object.keys(
            cityCoordinates
          ).find(
            (city) =>
              city.toLowerCase() ===
              cityName?.toLowerCase()
          );

        if (!matchingCity) {
          return null;
        }

        return {
          ...req,

          position:
            cityCoordinates[
              matchingCity
            ],
        };
      })
      .filter(Boolean);

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (date) => {
    if (!date) {
      return 'N/A';
    }

    return new Date(
      date
    ).toLocaleDateString(
      'en-PK',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );
  };

  // =========================================================
  // URGENCY HELPER
  // =========================================================

  const isUrgent = (urgency) =>
    urgency === 'urgent' ||
    urgency === 'critical';

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="home-page">

      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="navbar">

        <div className="navbar-container">

          <div className="navbar-brand">

            <span className="brand-icon">
              🩸
            </span>

            <span className="brand-text">
              BloodBridge
            </span>

          </div>

          <nav className="navbar-menu">

            <a
              href="/"
              className="nav-link active"
            >
              Home
            </a>

            <a
              href="/requests"
              className="nav-link"
            >
              Requests
            </a>

            <a
              href="/donors"
              className="nav-link"
            >
              Donors
            </a>

            <a
              href="/leaderboard"
              className="nav-link"
            >
              Leaderboard
            </a>

            <a
              href="/health-reminders"
              className="nav-link"
            >
              Health Reminders
            </a>

            <a
              href="/health-history"
              className="nav-link"
            >
              Health History
            </a>

            <a
              href="/blog"
              className="nav-link"
            >
              Blog
            </a>

            <a
              href="/about"
              className="nav-link"
            >
              About
            </a>

          </nav>

          <div className="navbar-auth">

            <a
              href="/login"
              className="btn-login"
            >
              <span>🔑</span>
              {' '}
              Sign In
            </a>

            <a
              href="/register"
              className="btn-register"
            >
              <span>🆕</span>
              {' '}
              Register
            </a>

          </div>

        </div>

      </header>

      {/* =====================================================
          REAL ALERT BAR
      ===================================================== */}

      <div className="alert-bar">

        <div className="alert-icon">
          ⚠️
        </div>

        <div className="alert-text">
          {alerts[currentAlert] ||
            alerts[0]}
        </div>

      </div>

      {/* =====================================================
          HERO
      ===================================================== */}

      <section className="hero">

        <div className="hero-overlay" />

        <div className="hero-content">

          <div className="hero-badge">
            Lifesaver Community
          </div>

          <h1>
            Connect Donors with Those
            in Need
          </h1>

          <p>
            Join our community of
            lifesavers. Whether you can
            donate blood or need it,
            we're here to help you
            connect and save lives
            together.
          </p>

          <div className="hero-btns">

            <a
              href="/register"
              className="hero-btn-primary"
            >
              <span>🩸</span>
              {' '}
              Become a Donor
            </a>

            <a
              href="/requests"
              className="hero-btn-secondary"
            >
              <span>📋</span>
              {' '}
              Request Blood
            </a>

          </div>

          {/* Existing website stats kept unchanged */}

          <div className="hero-stats">

            <div className="stat-item">

              <span className="stat-number">
                5,000+
              </span>

              <span className="stat-label">
                Donors
              </span>

            </div>

            <div className="stat-divider">
            </div>

            <div className="stat-item">

              <span className="stat-number">
                1,200+
              </span>

              <span className="stat-label">
                Lives Saved
              </span>

            </div>

            <div className="stat-divider">
            </div>

            <div className="stat-item">

              <span className="stat-number">
                50+
              </span>

              <span className="stat-label">
                Hospitals
              </span>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          REAL BLOOD REQUESTS
      ===================================================== */}

      <section className="requests-section">

        <div className="container">

          <div className="section-header">

            <h2 className="section-title">
              Latest Blood Requests
            </h2>

            <p className="section-subtitle">
              Real blood requests posted
              by BloodBridge users
            </p>

          </div>

          {loadingRequests ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px',
              }}
            >
              Loading blood requests...
            </div>

          ) : requestError ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#c0392b',
              }}
            >
              ❌ {requestError}
            </div>

          ) : homeRequests.length === 0 ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px',
              }}
            >
              <p
                style={{
                  fontSize: '36px',
                }}
              >
                🩸
              </p>

              <p>
                No blood requests
                available right now.
              </p>

            </div>

          ) : (

            <div className="requests-grid">

              {homeRequests.map(
                (req) => (

                  <div
                    key={req._id}
                    className={`request-card ${
                      isUrgent(
                        req.urgency
                      )
                        ? 'urgent-card'
                        : ''
                    }`}
                  >

                    <div className="card-header">

                      <div className="blood-group-badge">
                        {req.bloodGroup}
                      </div>

                      {isUrgent(
                        req.urgency
                      ) && (

                        <span className="urgency-badge">
                          {req.urgency
                            ?.toUpperCase()}
                        </span>

                      )}

                    </div>

                    <div className="card-body">

                      <h3 className="card-hospital">
                        {req.details ||
                          'Blood Required'}
                      </h3>

                      <div className="card-details">

                        <p className="card-info">

                          <span className="info-icon">
                            📍
                          </span>

                          {' '}
                          {req.city ||
                            'Location not specified'}

                        </p>

                        <p className="card-info">

                          <span className="info-icon">
                            👤
                          </span>

                          {' '}
                          {req.postedBy
                            ?.name ||
                            'Blood Receiver'}

                        </p>

                        <p className="card-info">

                          <span className="info-icon">
                            📞
                          </span>

                          {' '}
                          {req.postedBy
                            ?.phone ||
                            'Contact through BloodBridge'}

                        </p>

                        <p className="card-info">

                          <span className="info-icon">
                            🕐
                          </span>

                          {' '}
                          Posted:{' '}

                          {formatDate(
                            req.createdAt
                          )}

                        </p>

                      </div>

                    </div>

                    <a
                      href="/requests"
                      className="respond-btn"
                    >
                      <span>🤝</span>
                      {' '}
                      Respond to Request
                    </a>

                  </div>

                )
              )}

            </div>

          )}

          {bloodRequests.length > 4 && (

            <div
              style={{
                textAlign: 'center',
                marginTop: '30px',
              }}
            >

              <a
                href="/requests"
                className="respond-btn"
                style={{
                  display:
                    'inline-flex',
                }}
              >
                View All Blood Requests →
              </a>

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          REAL REQUESTS MAP
      ===================================================== */}

      <section className="map-section">

        <div className="container">

          <div className="section-header">

            <h2 className="section-title">
              Live Blood Requests Across
              Pakistan
            </h2>

            <p className="section-subtitle">
              Blood requests currently
              available on BloodBridge
            </p>

          </div>

          <div className="map-wrapper">

            <MapContainer
              center={[
                30.3753,
                69.3451,
              ]}
              zoom={5}
              style={{
                height: '500px',
                width: '100%',
              }}
              scrollWheelZoom={false}
            >

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />

              {mapRequests.map(
                (req) => (

                  <Marker
                    key={req._id}
                    position={
                      req.position
                    }
                    icon={redIcon}
                  >

                    <Popup>

                      <div className="map-popup">

                        <div className="popup-blood">
                          {req.bloodGroup}
                        </div>

                        <p className="popup-hospital">
                          {req.details ||
                            'Blood Required'}
                        </p>

                        <p className="popup-distance">
                          📍 {req.city}
                        </p>

                        {isUrgent(
                          req.urgency
                        ) && (

                          <span className="popup-urgent">
                            {req.urgency
                              ?.toUpperCase()}
                          </span>

                        )}

                        <a
                          href="/requests"
                          className="popup-help-btn"
                        >
                          Help Now
                        </a>

                      </div>

                    </Popup>

                  </Marker>

                )
              )}

            </MapContainer>

          </div>

        </div>

      </section>

      {/* =====================================================
          HOW IT WORKS
      ===================================================== */}

      <section className="how-section">

        <div className="container">

          <div className="section-header">

            <h2 className="section-title">
              How It Works
            </h2>

            <p className="section-subtitle">
              Simple steps to join our
              lifesaving community
            </p>

          </div>

          <div className="how-grid">

            {howItWorks.map(
              (item, i) => (

                <div
                  key={i}
                  className="how-card"
                >

                  <div className="how-card-icon">
                    0{i + 1}
                  </div>

                  <h3>
                    {item.title}
                  </h3>

                  <p>
                    {item.desc}
                  </p>

                </div>

              )
            )}

          </div>

        </div>

      </section>

      {/* =====================================================
          REAL LEADERBOARD
      ===================================================== */}

      <section className="leaderboard-section">

        <div className="container">

          <div className="section-header">

            <h2 className="section-title">
              Top Donors Leaderboard
            </h2>

            <p className="section-subtitle">
              Celebrating our real
              BloodBridge community
              heroes
            </p>

          </div>

          {loadingLeaderboard ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px',
              }}
            >
              Loading leaderboard...
            </div>

          ) : leaderboardError ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px',
                color: '#c0392b',
              }}
            >
              ❌ {leaderboardError}
            </div>

          ) : homeTopDonors.length ===
            0 ? (

            <div
              style={{
                textAlign: 'center',
                padding: '40px',
              }}
            >

              <p
                style={{
                  fontSize: '40px',
                }}
              >
                🏆
              </p>

              <p>
                No donors on the
                leaderboard yet.
              </p>

            </div>

          ) : (

            <table className="leaderboard-table">

              <thead>

                <tr>

                  <th>
                    RANK
                  </th>

                  <th>
                    DONOR NAME
                  </th>

                  <th>
                    BLOOD TYPE
                  </th>

                  <th>
                    DONATIONS
                  </th>

                  <th>
                    POINTS
                  </th>

                  <th>
                    ACHIEVEMENTS
                  </th>

                </tr>

              </thead>

              <tbody>

                {homeTopDonors.map(
                  (donor) => (

                    <tr
                      key={
                        donor._id ||
                        donor.rank
                      }
                    >

                      <td>

                        <span
                          className={`rank-badge rank-${donor.rank}`}
                        >
                          {donor.rank ===
                          1
                            ? '🥇'
                            : donor.rank ===
                                2
                              ? '🥈'
                              : donor.rank ===
                                  3
                                ? '🥉'
                                : donor.rank}
                        </span>

                      </td>

                      <td>
                        {donor.name}
                      </td>

                      <td>

                        <span className="blood-type-badge">
                          {
                            donor.bloodGroup
                          }
                        </span>

                      </td>

                      <td>
                        {
                          donor.donations
                        }
                      </td>

                      <td>
                        {donor.points}
                      </td>

                      <td>

                        {donor.achievement ? (

                          <span className="achievement-badge">
                            {
                              donor.achievement
                            }
                          </span>

                        ) : donor.level ? (

                          <span className="achievement-badge">
                            {
                              donor.level
                                ?.icon
                            }
                            {' '}
                            {
                              donor.level
                                ?.label
                            }
                          </span>

                        ) : (
                          '—'
                        )}

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          )}

          {topDonors.length > 5 && (

            <div
              style={{
                textAlign: 'center',
                marginTop: '25px',
              }}
            >

              <a
                href="/leaderboard"
                className="respond-btn"
                style={{
                  display:
                    'inline-flex',
                }}
              >
                View Full Leaderboard →
              </a>

            </div>

          )}

        </div>

      </section>

      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="footer">

        <div className="footer-content">

          <div className="footer-section">

            <h3>
              BloodBridge
            </h3>

            <p>
              Connecting donors with
              those in need across
              Pakistan.
            </p>

          </div>

          <div className="footer-section">

            <h4>
              Quick Links
            </h4>

            <a href="/requests">
              Blood Requests
            </a>

            <a href="/donors">
              Find Donors
            </a>

            <a href="/about">
              About Us
            </a>

          </div>

          <div className="footer-section">

            <h4>
              Contact
            </h4>

            <p>
              📧 info@bloodbridge.com
            </p>

            <p>
              📞 +92 300 1234567
            </p>

          </div>

        </div>

        <div className="footer-bottom">

          <p>
            &copy; 2026 BloodBridge.
            All rights reserved. | Made
            with ❤️ in Pakistan
          </p>

        </div>

      </footer>

    </div>
  );
};

export default Home;