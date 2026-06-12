import { useState }          from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth }           from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const { login, loading } = useAuth();
  const navigate           = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(email, password);
      if (user.role === 'admin')         navigate('/admin/dashboard');
      else if (user.role === 'donor')    navigate('/donor/dashboard');
      else if (user.role === 'receiver') navigate('/receiver/dashboard');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="login-page">
      {/* Navbar */}
      <header className="login-navbar">
        <div className="login-nav-inner">
          <a href="/" className="login-brand">🩸 BloodBridge</a>
          <div className="login-nav-links">
            <a href="/login"    className="login-nav-active">Sign In</a>
            <a href="/register" className="login-nav-btn">Register</a>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="login-container">
        <div className="login-card">
          <div className="login-icon">🩸</div>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-sub">Sign in to your BloodBridge account</p>

          {error && (
            <div className="login-error">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="login-forgot">
              <a href="/forgot-password">Forgot Password?</a>
            </div>

            <button
              type="submit"
              className="login-btn"
              disabled={loading}
            >
              {loading ? '⏳ Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="login-register-link">
            Don't have an account?{' '}
            <Link to="/register">Register here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;