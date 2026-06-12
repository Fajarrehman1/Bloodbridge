import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../context/AuthContext';
import './Health.css';

const Health = () => {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [nextDate, setNextDate] = useState('');

  const reminders = [
    {
      icon: '🩸',
      title: 'Donation Eligibility',
      desc:  'You can donate whole blood every 56 days (8 weeks).',
      tip:   'Check your last donation date below',
      color: '#c0392b'
    },
    {
      icon: '💧',
      title: 'Stay Hydrated',
      desc:  'Drink at least 2-3 liters of water the day before and after donation.',
      tip:   'Avoid alcohol 24 hours before donating',
      color: '#2980b9'
    },
    {
      icon: '🥗',
      title: 'Eat Iron-Rich Foods',
      desc:  'Eat spinach, red meat, beans, and fortified cereals before donating.',
      tip:   'Avoid fatty foods 4 hours before donation',
      color: '#27ae60'
    },
    {
      icon: '😴',
      title: 'Get Enough Sleep',
      desc:  'Sleep at least 7-8 hours the night before your donation.',
      tip:   'Avoid strenuous exercise on donation day',
      color: '#8e44ad'
    },
    {
      icon: '💊',
      title: 'Medication Check',
      desc:  'Some medications may affect eligibility. Consult your doctor.',
      tip:   'Blood thinners require 3-day waiting period',
      color: '#e67e22'
    },
    {
      icon: '🏃',
      title: 'Post-Donation Care',
      desc:  'Rest for 10-15 minutes after donation. Avoid heavy lifting for 24 hours.',
      tip:   'Eat a snack after donating to restore energy',
      color: '#16a085'
    },
  ];

  const eligibilityChecks = [
    { label: 'Age between 18-65',               pass: true  },
    { label: 'Weight above 50 kg',               pass: true  },
    { label: 'Hemoglobin level above 12.5 g/dL', pass: true  },
    { label: 'No recent illness (past 2 weeks)',  pass: true  },
    { label: 'No tattoo in past 6 months',        pass: false },
    { label: 'No recent surgery',                 pass: true  },
  ];

  const calculateNextDate = (lastDate) => {
    if (!lastDate) return;
    const next = new Date(lastDate);
    next.setDate(next.getDate() + 56);
    setNextDate(next.toLocaleDateString());
  };

  return (
    <div className="health-page">
      {/* Navbar */}
      <header className="health-navbar">
        <div className="health-nav-inner">
          <a href="/" className="health-brand">🩸 BloodBridge</a>
          <nav className="health-nav-links">
            <a href="/">Home</a>
            <a href="/requests">Requests</a>
            <a href="/donors">Donors</a>
            <a href="/health-reminders" className="active">Health</a>
          </nav>
          <div className="health-nav-auth">
            {user ? (
              <a href={
                user.role === 'donor'    ? '/donor/dashboard'    :
                user.role === 'receiver' ? '/receiver/dashboard' :
                '/admin/dashboard'
              } className="health-dashboard-btn">
                Dashboard
              </a>
            ) : (
              <>
                <a href="/login"    className="health-signin">Sign In</a>
                <a href="/register" className="health-register">Register</a>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="health-container">
        <div className="health-hero">
          <h1>🏥 Health Reminders</h1>
          <p>Stay healthy and be ready to donate blood when needed most.</p>
        </div>

        {/* Reminders Grid */}
        <div className="health-grid">
          {reminders.map((r, i) => (
            <div key={i} className="health-card">
              <div
                className="health-card-icon"
                style={{ background: r.color }}
              >
                {r.icon}
              </div>
              <div className="health-card-body">
                <h3>{r.title}</h3>
                <p>{r.desc}</p>
                <div className="health-tip">
                  💡 {r.tip}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Eligibility Checker */}
        <div className="health-eligibility">
          <h2>✅ Eligibility Checklist</h2>
          <p>Check if you are eligible to donate blood today</p>
          <div className="health-checks">
            {eligibilityChecks.map((check, i) => (
              <div
                key={i}
                className={`health-check-item ${check.pass ? 'pass' : 'fail'}`}
              >
                <span className="health-check-icon">
                  {check.pass ? '✅' : '❌'}
                </span>
                <span>{check.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Donation Calculator */}
        <div className="health-calculator">
          <h2>📅 Next Donation Calculator</h2>
          <p>Enter your last donation date to find when you can donate again</p>
          <div className="health-calc-form">
            <input
              type="date"
              className="health-date-input"
              onChange={e => calculateNextDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            {nextDate && (
              <div className="health-next-date">
                🎉 You can donate again on: <strong>{nextDate}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Blood Pressure & Iron Tips */}
        <div className="health-tips-grid">
          <div className="health-tip-card red">
            <h3>🩸 Iron Levels</h3>
            <ul>
              <li>Eat red meat, spinach, lentils</li>
              <li>Avoid tea/coffee with meals</li>
              <li>Take Vitamin C to absorb iron</li>
              <li>Minimum hemoglobin: 12.5 g/dL</li>
            </ul>
          </div>
          <div className="health-tip-card blue">
            <h3>💓 Blood Pressure</h3>
            <ul>
              <li>Normal range: 90/60 to 180/100</li>
              <li>Avoid salt and processed foods</li>
              <li>Exercise regularly</li>
              <li>Manage stress levels</li>
            </ul>
          </div>
          <div className="health-tip-card green">
            <h3>🥤 Hydration</h3>
            <ul>
              <li>Drink 2-3L water daily</li>
              <li>Avoid alcohol 24h before</li>
              <li>Drink juice after donation</li>
              <li>Avoid caffeine before donating</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Health;