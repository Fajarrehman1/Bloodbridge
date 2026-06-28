import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import { getLeaderboard }      from '../api/services';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();

  const [donors,      setDonors]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [filter,      setFilter]      = useState('all');
  const [bloodFilter, setBloodFilter] = useState('');
  const [stats,       setStats]       = useState({});
  const [error,       setError]       = useState('');

  const cities     = ['all','Lahore','Karachi','Islamabad','Multan','Peshawar'];
  const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

  useEffect(() => {
    fetchLeaderboard();
  }, [bloodFilter, filter]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (bloodFilter)      params.bloodGroup = bloodFilter;
      if (filter !== 'all') params.city       = filter;

      const res  = await getLeaderboard(params);
      const data = res.data;

      console.log('Leaderboard data:', data);

      const list = data?.leaderboard || [];

      const mapped = list.map((d, i) => ({
        rank:        d.rank        || i + 1,
        _id:         d._id,
        name:        d.name,
        bloodGroup:  d.bloodGroup,
        city:        d.city        || '',
        donations:   d.donations   || 0,
        points:      d.points      || 0,
        level:       d.level,
        achievement: d.achievement || '',
        badge:       i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐',
        available:   d.available
      }));

      setDonors(mapped);
      setStats(data?.stats || {});
      setLoading(false);
    } catch (err) {
      console.error('Leaderboard fetch error:', err);
      setError('Failed to load leaderboard');
      setLoading(false);
    }
  };

  const top3 = donors.slice(0, 3);

  return (
    <div className="lb-page">

      {/* ── Navbar ── */}
      <header className="lb-navbar">
        <div className="lb-nav-inner">
          <a href="/" className="lb-brand">🩸 BloodBridge</a>
          <nav className="lb-nav-links">
            <a href="/">Home</a>
            <a href="/requests">Requests</a>
            <a href="/donors">Donors</a>
            <a href="/leaderboard" className="active">Leaderboard</a>
          </nav>
          <div className="lb-nav-auth">
            {user ? (
              <a
                href={
                  user.role === 'donor'    ? '/donor/dashboard'    :
                  user.role === 'receiver' ? '/receiver/dashboard' :
                  '/admin/dashboard'
                }
                className="lb-dashboard-btn"
              >
                Dashboard
              </a>
            ) : (
              <>
                <a href="/login"    className="lb-signin">Sign In</a>
                <a href="/register" className="lb-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="lb-hero">
        <h1>🏆 Leaderboard</h1>
        <p>Celebrating our top blood donors who save lives every day</p>
      </div>

      <div className="lb-container">

        {/* ── Podium Top 3 ── */}
        {!loading && top3.length >= 2 && (
          <div className="lb-podium">
            {/* 2nd Place */}
            {top3[1] && (
              <div className="lb-podium-item second">
                <div className="lb-podium-badge">🥈</div>
                <div className="lb-podium-avatar">{top3[1].name?.charAt(0)}</div>
                <p className="lb-podium-name">{top3[1].name}</p>
                <p className="lb-podium-blood">{top3[1].bloodGroup}</p>
                <p className="lb-podium-city">📍 {top3[1].city}</p>
                <p className="lb-podium-donations">{top3[1].donations} donations</p>
                <p className="lb-podium-pts">{top3[1].points} pts</p>
                <div className="lb-podium-stand second-stand">2nd</div>
              </div>
            )}

            {/* 1st Place */}
            {top3[0] && (
              <div className="lb-podium-item first">
                <div className="lb-podium-badge">🥇</div>
                <div className="lb-podium-avatar gold">{top3[0].name?.charAt(0)}</div>
                <p className="lb-podium-name">{top3[0].name}</p>
                <p className="lb-podium-blood">{top3[0].bloodGroup}</p>
                <p className="lb-podium-city">📍 {top3[0].city}</p>
                <p className="lb-podium-donations">{top3[0].donations} donations</p>
                <p className="lb-podium-pts">{top3[0].points} pts</p>
                <div className="lb-podium-stand first-stand">1st</div>
              </div>
            )}

            {/* 3rd Place */}
            {top3[2] && (
              <div className="lb-podium-item third">
                <div className="lb-podium-badge">🥉</div>
                <div className="lb-podium-avatar">{top3[2].name?.charAt(0)}</div>
                <p className="lb-podium-name">{top3[2].name}</p>
                <p className="lb-podium-blood">{top3[2].bloodGroup}</p>
                <p className="lb-podium-city">📍 {top3[2].city}</p>
                <p className="lb-podium-donations">{top3[2].donations} donations</p>
                <p className="lb-podium-pts">{top3[2].points} pts</p>
                <div className="lb-podium-stand third-stand">3rd</div>
              </div>
            )}
          </div>
        )}

        {/* ── City Filter ── */}
        <div className="lb-filters">
          {cities.map(city => (
            <button
              key={city}
              className={`lb-filter-btn ${filter === city ? 'active' : ''}`}
              onClick={() => setFilter(city)}
            >
              {city === 'all' ? '🌍 All Cities' : `📍 ${city}`}
            </button>
          ))}
        </div>

        {/* ── Blood Group Filter ── */}
        <div className="lb-blood-filters">
          <button
            className={`lb-blood-btn ${bloodFilter === '' ? 'active' : ''}`}
            onClick={() => setBloodFilter('')}
          >
            All
          </button>
          {BLOOD_GROUPS.map(bg => (
            <button
              key={bg}
              className={`lb-blood-btn ${bloodFilter === bg ? 'active' : ''}`}
              onClick={() => setBloodFilter(bloodFilter === bg ? '' : bg)}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* ── Error ── */}
        {error && (
          <div style={{ textAlign:'center', padding:'40px', color:'#e74c3c' }}>
            ❌ {error}
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div className="lb-loading">
            <div className="lb-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && donors.length === 0 && (
          <div className="lb-table-wrap" style={{ textAlign:'center', padding:'60px' }}>
            <p style={{ fontSize:'48px' }}>🏆</p>
            <p style={{ fontSize:'18px', fontWeight:700, color:'#333' }}>
              No donors on leaderboard yet
            </p>
            <p style={{ color:'#aaa', marginTop:'8px' }}>
              Complete blood donations to appear here!
            </p>
          </div>
        )}

        {/* ── Table ── */}
        {!loading && !error && donors.length > 0 && (
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>RANK</th>
                  <th>DONOR NAME</th>
                  <th>BLOOD TYPE</th>
                  <th>CITY</th>
                  <th>DONATIONS</th>
                  <th>POINTS</th>
                  <th>LEVEL</th>
                  <th>ACHIEVEMENTS</th>
                </tr>
              </thead>
              <tbody>
                {donors.map(donor => (
                  <tr
                    key={donor._id}
                    className={donor.rank <= 3 ? 'top-row' : ''}
                    onClick={() => donor._id && navigate(`/donor/${donor._id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td className="lb-rank">
                      {donor.badge} {donor.rank}
                    </td>
                    <td className="lb-name-cell">
                      <div className="lb-avatar">
                        {donor.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {donor.name}
                      {String(donor._id) === String(user?._id) && (
                        <span style={{
                          background:'#c0392b', color:'white',
                          fontSize:'10px', padding:'2px 7px',
                          borderRadius:'8px', marginLeft:'6px'
                        }}>You</span>
                      )}
                    </td>
                    <td>
                      <span className="lb-blood-badge">{donor.bloodGroup}</span>
                    </td>
                    <td>{donor.city || '—'}</td>
                    <td className="lb-donations-col">{donor.donations}</td>
                    <td className="lb-points-col">{donor.points} pts</td>
                    <td>
                      <span style={{ color: donor.level?.color, fontWeight:700 }}>
                        {donor.level?.icon} {donor.level?.label}
                      </span>
                    </td>
                    <td>
                      {donor.achievement && (
                        <span className="lb-achievement">{donor.achievement}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── How Points Work ── */}
        <div className="lb-points-info">
          <h3>🌟 How Points Work</h3>
          <div className="lb-points-grid">
            <div className="lb-points-card">
              <span>🩸</span>
              <p><b>10 Points</b></p>
              <p>Per Confirmed Donation</p>
            </div>
            <div className="lb-points-card">
              <span>🥉</span>
              <p><b>Bronze</b></p>
              <p>10+ Points</p>
            </div>
            <div className="lb-points-card">
              <span>🥇</span>
              <p><b>Gold</b></p>
              <p>50+ Points</p>
            </div>
            <div className="lb-points-card">
              <span>👑</span>
              <p><b>Platinum</b></p>
              <p>100+ Points</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;