import { useState }          from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';
import './Register.css';

const Register = () => {
  const { registerDonor, registerReceiver, loading } = useAuth();
  const navigate = useNavigate();
  const [role,  setRole]  = useState('donor');
  const [error, setError] = useState('');
  const [form,  setForm]  = useState({
    name: '', email: '', password: '', phone: '',
    city: '', bloodGroup: '', healthNote: ''
  });

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (role === 'donor') {
        await registerDonor({ ...form, role: 'donor' });
        navigate('/donor/dashboard');
      } else {
        await registerReceiver({ ...form, role: 'receiver' });
        navigate('/receiver/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="reg-page">
      {/* Navbar */}
      <header className="reg-navbar">
        <div className="reg-nav-inner">
          <a href="/" className="reg-brand">🩸 BloodBridge</a>
          <div className="reg-nav-links">
            <a href="/login"    className="reg-nav-btn">Sign In</a>
            <a href="/register" className="reg-nav-active">Register</a>
          </div>
        </div>
      </header>

      <div className="reg-container">
        <div className="reg-card">
          <div className="reg-icon">🩸</div>
          <h2 className="reg-title">Create Account</h2>
          <p className="reg-sub">Join BloodBridge and save lives</p>

          {/* Role Tabs */}
          <div className="reg-tabs">
            <button
              className={`reg-tab ${role === 'donor' ? 'active' : ''}`}
              onClick={() => setRole('donor')}
              type="button"
            >
              🩸 I am a Donor
            </button>
            <button
              className={`reg-tab ${role === 'receiver' ? 'active' : ''}`}
              onClick={() => setRole('receiver')}
              type="button"
            >
              🏥 I Need Blood
            </button>
          </div>

          {error && <div className="reg-error">{error}</div>}

          <form onSubmit={handleSubmit} className="reg-form">
            {/* Row 1 */}
            <div className="reg-row">
              <div className="reg-field">
                <label>Full Name *</label>
                <input
                  placeholder="Your name"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                  required
                />
              </div>
              <div className="reg-field">
                <label>Phone</label>
                <input
                  placeholder="03001234567"
                  value={form.phone}
                  onChange={e => update('phone', e.target.value)}
                />
              </div>
            </div>

            {/* Email */}
            <div className="reg-field">
              <label>Email *</label>
              <input
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => update('email', e.target.value)}
                required
              />
            </div>

            {/* Password */}
            <div className="reg-field">
              <label>Password *</label>
              <input
                type="password"
                placeholder="Minimum 6 characters"
                value={form.password}
                onChange={e => update('password', e.target.value)}
                required
              />
            </div>

            {/* City */}
            <div className="reg-field">
              <label>City *</label>
              <input
                placeholder="Lahore, Karachi, Islamabad..."
                value={form.city}
                onChange={e => update('city', e.target.value)}
                required
              />
            </div>

            {/* Donor Only Fields */}
            {role === 'donor' && (
              <>
                <div className="reg-field">
                  <label>Blood Group *</label>
                  <select
                    value={form.bloodGroup}
                    onChange={e => update('bloodGroup', e.target.value)}
                    required
                  >
                    <option value="">Select Blood Group</option>
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>
                <div className="reg-field">
                  <label>Health Note</label>
                  <input
                    placeholder="Any health conditions..."
                    value={form.healthNote}
                    onChange={e => update('healthNote', e.target.value)}
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className="reg-btn"
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : 'Create Account'}
            </button>
          </form>

          <p className="reg-login-link">
            Already have an account?{' '}
            <Link to="/login">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;