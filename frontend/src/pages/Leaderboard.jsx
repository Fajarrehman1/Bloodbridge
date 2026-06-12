import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getLeaderboard } from '../api/services';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [bloodFilter, setBloodFilter] = useState('');

  // Static fallback data
  const staticDonors = [
    { rank: 1, name: 'Ali Ahmed', bloodGroup: 'O+', donations: 15, points: 150, city: 'Lahore', achievement: 'Gold Donor', badge: '🥇', _id: '1' },
    { rank: 2, name: 'Sara Khan', bloodGroup: 'A+', donations: 12, points: 120, city: 'Karachi', achievement: 'Gold Donor', badge: '🥈', _id: '2' },
    { rank: 3, name: 'Usman Malik', bloodGroup: 'B-', donations: 10, points: 100, city: 'Islamabad', achievement: 'Certificate Earned', badge: '🥉', _id: '3' },
    { rank: 4, name: 'Fatima Raza', bloodGroup: 'AB+', donations: 8, points: 80, city: 'Lahore', achievement: '', badge: '⭐', _id: '4' },
    { rank: 5, name: 'Bilal Hassan', bloodGroup: 'O-', donations: 7, points: 70, city: 'Karachi', achievement: '', badge: '⭐', _id: '5' },
    { rank: 6, name: 'Zara Ahmed', bloodGroup: 'A-', donations: 6, points: 60, city: 'Multan', achievement: '', badge: '⭐', _id: '6' },
    { rank: 7, name: 'Hassan Ali', bloodGroup: 'B+', donations: 5, points: 50, city: 'Peshawar', achievement: '', badge: '⭐', _id: '7' },
    { rank: 8, name: 'Ayesha Noor', bloodGroup: 'O+', donations: 4, points: 40, city: 'Lahore', achievement: '', badge: '⭐', _id: '8' },
    { rank: 9, name: 'Omar Farooq', bloodGroup: 'AB-', donations: 3, points: 30, city: 'Karachi', achievement: '', badge: '⭐', _id: '9' },
    { rank: 10, name: 'Hira Baig', bloodGroup: 'A+', donations: 2, points: 20, city: 'Islamabad', achievement: '', badge: '⭐', _id: '10' },
  ];

  const cities = ['all', 'Lahore', 'Karachi', 'Islamabad', 'Multan', 'Peshawar'];

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await getLeaderboard({});
      const list = res.data?.leaderboard || [];

      if (list.length > 0) {
        const mapped = list.map((d, i) => ({
          rank: d.rank || i + 1,
          name: d.name,
          bloodGroup: d.bloodGroup,
          donations: d.donations || 0,
          points: d.points || 0,
          city: d.city || '',
          achievement: d.donations >= 10 ? 'Gold Donor' : d.donations >= 5 ? 'Regular Donor' : d.donations >= 1 ? 'Active Donor' : '',
          badge: d.rank === 1 ? '🥇' : d.rank === 2 ? '🥈' : d.rank === 3 ? '🥉' : '⭐',
          _id: d._id || ''
        }));
        setDonors(mapped);
      } else {
        setDonors(staticDonors);
      }
      setLoading(false);
    } catch (err) {
      setDonors(staticDonors);
      setLoading(false);
    }
  };

  const filtered = donors.filter(d => {
    const matchCity = filter === 'all' || d.city === filter;
    const matchBlood = !bloodFilter || d.bloodGroup === bloodFilter;
    return matchCity && matchBlood;
  });

  const top3 = filtered.slice(0, 3);

  return (
    <div className="lb-page">

      {/* Navbar */}
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
                  user.role === 'donor' ? '/donor/dashboard' :
                  user.role === 'receiver' ? '/receiver/dashboard' :
                  '/admin/dashboard'
                }
                className="lb-dashboard-btn"
              >
                Dashboard
              </a>
            ) : (
              <>
                <a href="/login" className="lb-signin">Sign In</a>
                <a href="/register" className="lb-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="lb-hero">
        <h1>🏆 Leaderboard</h1>
        <p>Celebrating our top blood donors who save lives every day</p>
      </div>

      <div className="lb-container">

        {/* Podium Top 3 */}
        {!loading && top3.length >= 3 && (
          <div className="lb-podium">

            {/* 2nd Place */}
            <div className="lb-podium-item second">
              <div className="lb-podium-badge">🥈</div>
              <div className="lb-podium-avatar">
                {top3[1]?.name?.charAt(0)}
              </div>
              <p className="lb-podium-name">{top3[1]?.name}</p>
              <p className="lb-podium-blood">{top3[1]?.bloodGroup}</p>
              <p className="lb-podium-donations">
                {top3[1]?.donations} donations
              </p>
              <div className="lb-podium-stand second-stand">2nd</div>
            </div>

            {/* 1st Place */}
            <div className="lb-podium-item first">
              <div className="lb-podium-badge">🥇</div>
              <div className="lb-podium-avatar gold">
                {top3[0]?.name?.charAt(0)}
              </div>
              <p className="lb-podium-name">{top3[0]?.name}</p>
              <p className="lb-podium-blood">{top3[0]?.bloodGroup}</p>
              <p className="lb-podium-donations">
                {top3[0]?.donations} donations
              </p>
              <div className="lb-podium-stand first-stand">1st</div>
            </div>

            {/* 3rd Place */}
            <div className="lb-podium-item third">
              <div className="lb-podium-badge">🥉</div>
              <div className="lb-podium-avatar">
                {top3[2]?.name?.charAt(0)}
              </div>
              <p className="lb-podium-name">{top3[2]?.name}</p>
              <p className="lb-podium-blood">{top3[2]?.bloodGroup}</p>
              <p className="lb-podium-donations">
                {top3[2]?.donations} donations
              </p>
              <div className="lb-podium-stand third-stand">3rd</div>
            </div>

          </div>
        )}

        {/* City Filter */}
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

        {/* Blood Group Filter */}
        <div className="lb-blood-filters">
          <button
            className={`lb-blood-btn ${bloodFilter === '' ? 'active' : ''}`}
            onClick={() => setBloodFilter('')}
          >
            All
          </button>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
            <button
              key={bg}
              className={`lb-blood-btn ${bloodFilter === bg ? 'active' : ''}`}
              onClick={() => setBloodFilter(bloodFilter === bg ? '' : bg)}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="lb-loading">
            <div className="lb-spinner"></div>
            <p>Loading leaderboard...</p>
          </div>
        ) : (
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
                  <th>ACHIEVEMENTS</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(donor => (
                  <tr
                    key={donor._id || donor.rank}
                    className={donor.rank <= 3 ? 'top-row' : ''}
                    onClick={() => donor._id && navigate(`/donor/${donor._id}`)}
                    style={{ cursor: donor._id ? 'pointer' : 'default' }}
                  >
                    <td className="lb-rank">
                      {donor.badge} {donor.rank}
                    </td>
                    <td className="lb-name-cell">
                      <div className="lb-avatar">
                        {donor.name?.charAt(0)?.toUpperCase()}
                      </div>
                      {donor.name}
                    </td>
                    <td>
                      <span className="lb-blood-badge">
                        {donor.bloodGroup}
                      </span>
                    </td>
                    <td>{donor.city || '—'}</td>
                    <td className="lb-donations-col">
                      {donor.donations}
                    </td>
                    <td className="lb-points-col">
                      {donor.points}
                    </td>
                    <td>
                      {donor.achievement && (
                        <span className="lb-achievement">
                          {donor.achievement}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* How Points Work */}
        <div className="lb-points-info">
          <h3>🌟 How Points Work</h3>
          <div className="lb-points-grid">
            <div className="lb-points-card">
              <span>🩸</span>
              <p><b>10 Points</b></p>
              <p>Per Donation</p>
            </div>
            <div className="lb-points-card">
              <span>⚡</span>
              <p><b>5 Points</b></p>
              <p>Emergency Response</p>
            </div>
            <div className="lb-points-card">
              <span>📅</span>
              <p><b>3 Points</b></p>
              <p>Regular Donor Bonus</p>
            </div>
            <div className="lb-points-card">
              <span>🏆</span>
              <p><b>Gold Donor</b></p>
              <p>100+ Points</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Leaderboard;