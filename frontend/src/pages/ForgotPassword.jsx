import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPassword.css';

const BACKEND = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace('/api', '')
  : 'http://localhost:8000';
const STEP    = { EMAIL: 1, OTP: 2, RESET: 3, DONE: 4 };

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step,        setStep]        = useState(STEP.EMAIL);
  const [email,       setEmail]       = useState('');
  const [otp,         setOtp]         = useState(['','','','','','']);
  const [verifiedOtp, setVerifiedOtp] = useState(''); // ← store verified OTP
  const [newPassword, setNewPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');
  const [devOtp,      setDevOtp]      = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const post = async (url, body) => {
    const res  = await fetch(`${BACKEND}/api/auth${url}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');
    return data;
  };

  // ── Step 1 — Send OTP ─────────────────────────────────
  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email'); return; }
    setError('');
    setLoading(true);
    try {
      const data = await post('/forgot-password', {
        email: email.toLowerCase().trim()
      });
      if (data.otp || data.devOtp) {
        setDevOtp(data.otp || data.devOtp);
      }
      setError('');
      setStep(STEP.OTP);
      startResendTimer();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── Step 2 — Verify OTP ───────────────────────────────
  const handleVerifyOTP = async (e) => {
    e?.preventDefault();
    const code = otp.join('').trim();
    if (code.length !== 6) { setError('Enter all 6 digits'); return; }
    setError('');
    setLoading(true);
    try {
      await post('/verify-otp', {
        email: email.toLowerCase().trim(),
        otp:   code
      });
      setVerifiedOtp(code); // ← save OTP for step 3
      setError('');
      setStep(STEP.RESET);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── Step 3 — Reset Password ───────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      // Send email + otp + newPassword (NOT resetToken)
      await post('/reset-password', {
        email:       email.toLowerCase().trim(),
        otp:         verifiedOtp,
        newPassword
      });
      setError('');
      setStep(STEP.DONE);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // ── OTP Input Handlers ────────────────────────────────
  const handleOtpChange = (i, val) => {
    if (!/^\d*$/.test(val)) return;
    const next = [...otp];
    next[i] = val.slice(-1);
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i+1}`)?.focus();
  };

  const handleOtpKey = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0)
      document.getElementById(`otp-${i-1}`)?.focus();
    if (e.key === 'Enter') handleVerifyOTP(e);
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      document.getElementById('otp-5')?.focus();
    }
  };

  const fillOtp = () => {
    if (!devOtp) return;
    const digits = devOtp.toString().split('');
    setOtp(digits);
    document.getElementById('otp-5')?.focus();
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const iv = setInterval(() => {
      setResendTimer(t => {
        if (t <= 1) { clearInterval(iv); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setError('');
    setLoading(true);
    try {
      const data = await post('/forgot-password', {
        email: email.toLowerCase().trim()
      });
      if (data.otp || data.devOtp) setDevOtp(data.otp || data.devOtp);
      setOtp(['','','','','','']);
      startResendTimer();
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const pwStrength = () => {
    const p = newPassword;
    if (!p) return { score: 0, label: '', color: '#ddd' };
    let s = 0;
    if (p.length >= 6)           s++;
    if (p.length >= 8)           s++;
    if (/[A-Z]/.test(p))         s++;
    if (/[0-9]/.test(p))         s++;
    if (/[^A-Za-z0-9]/.test(p))  s++;
    const map = [
      { label:'',           color:'#ddd'    },
      { label:'Weak',       color:'#e74c3c' },
      { label:'Fair',       color:'#e67e22' },
      { label:'Good',       color:'#f39c12' },
      { label:'Strong',     color:'#27ae60' },
      { label:'Very Strong',color:'#1e8449' },
    ];
    return { score: s, ...map[s] };
  };

  const pw = pwStrength();

  return (
    <div className="fp-page">
      <div className="fp-card">

        {/* Logo */}
        <div className="fp-logo" onClick={() => navigate('/')}>
          <div className="fp-logo-icon">🩸</div>
          <span>BloodBridge</span>
        </div>

        {/* Progress */}
        <div className="fp-progress">
          {[1,2,3,4].map(s => (
            <div key={s} className="fp-progress-step">
              <div className={`fp-step-circle ${step > s ? 'done' : step === s ? 'active' : ''}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`fp-step-line ${step > s ? 'done' : ''}`}></div>
              )}
            </div>
          ))}
        </div>
        <div className="fp-step-labels">
          {['Email','OTP','Password','Done'].map((l, i) => (
            <span key={l} className={step === i+1 ? 'active' : ''}>{l}</span>
          ))}
        </div>

        {/* Error */}
        {error && <div className="fp-error">❌ {error}</div>}

        {/* ── STEP 1 ── */}
        {step === STEP.EMAIL && (
          <div className="fp-body">
            <div className="fp-icon-big">🔐</div>
            <h2>Forgot Password?</h2>
            <p className="fp-desc">
              Enter your registered email address to get an OTP.
            </p>
            <form onSubmit={handleSendOTP} className="fp-form">
              <div className="fp-field">
                <label>Email Address</label>
                <input
  type="email"
  placeholder="your@email.com"
  value={email}
  onChange={e => setEmail(e.target.value)}
  onBlur={e => setEmail(e.target.value.toLowerCase().trim())}
  autoComplete="off"
  required
  autoFocus
/>
              </div>
              <button type="submit" className="fp-btn" disabled={loading}>
                {loading ? <><div className="fp-spin"></div> Sending...</> : '📧 Send OTP'}
              </button>
            </form>
            <button className="fp-back-link" onClick={() => navigate('/login')}>
              ← Back to Login
            </button>
          </div>
        )}

        {/* ── STEP 2 ── */}
        {step === STEP.OTP && (
          <div className="fp-body">
            <div className="fp-icon-big">📟</div>
            <h2>Enter OTP</h2>
            <p className="fp-desc">
              Your one-time password for <strong>{email}</strong>
            </p>

            {/* Dev OTP Box */}
            {devOtp && (
              <div className="fp-otp-reveal">
                <p className="fp-otp-reveal-title">🖥️ Your OTP (Local Dev Mode)</p>
                <div className="fp-otp-reveal-code">{devOtp}</div>
                <button
                  type="button"
                  className="fp-otp-fill-btn"
                  onClick={fillOtp}
                >
                  📋 Click to Fill OTP
                </button>
                <p className="fp-otp-reveal-timer">⏱ Valid for 10 minutes</p>
              </div>
            )}

            <form onSubmit={handleVerifyOTP} className="fp-form">
              <div className="fp-otp-row" onPaste={handleOtpPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    className="fp-otp-input"
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    autoFocus={i === 0}
                  />
                ))}
              </div>
              <button
                type="submit"
                className="fp-btn"
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? <><div className="fp-spin"></div> Verifying...</> : '✅ Verify OTP'}
              </button>
            </form>

            <div className="fp-resend-row">
              {resendTimer > 0
                ? <span className="fp-timer">Resend in {resendTimer}s</span>
                : <button className="fp-resend-btn" onClick={handleResend} disabled={loading}>
                    🔄 Resend OTP
                  </button>
              }
            </div>

            <button
              className="fp-back-link"
              onClick={() => { setError(''); setStep(STEP.EMAIL); setOtp(['','','','','','']); setDevOtp(''); }}
            >
              ← Change Email
            </button>
          </div>
        )}

        {/* ── STEP 3 ── */}
        {step === STEP.RESET && (
          <div className="fp-body">
            <div className="fp-icon-big">🔑</div>
            <h2>Set New Password</h2>
            <p className="fp-desc">Choose a strong password for your account.</p>
            <form onSubmit={handleReset} className="fp-form">
              <div className="fp-field">
                <label>New Password</label>
                <div className="fp-pass-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoFocus
                  />
                  <button type="button" className="fp-eye" onClick={() => setShowPass(p => !p)}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
                {newPassword && (
                  <div className="fp-strength">
                    <div className="fp-strength-bar">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="fp-strength-seg"
                          style={{ background: i <= pw.score ? pw.color : '#eee' }} />
                      ))}
                    </div>
                    <span style={{ color: pw.color, fontSize: 12, fontWeight: 700 }}>
                      {pw.label}
                    </span>
                  </div>
                )}
              </div>

              <div className="fp-field">
                <label>Confirm Password</label>
                <div className="fp-pass-wrap">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirmPass}
                    onChange={e => setConfirmPass(e.target.value)}
                    required
                  />
                  <button type="button" className="fp-eye" onClick={() => setShowConfirm(p => !p)}>
                    {showConfirm ? '🙈' : '👁️'}
                  </button>
                </div>
                {confirmPass && newPassword !== confirmPass && (
                  <p className="fp-match-err">⚠️ Passwords do not match</p>
                )}
                {confirmPass && newPassword === confirmPass && (
                  <p className="fp-match-ok">✅ Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                className="fp-btn"
                disabled={loading || newPassword.length < 6 || newPassword !== confirmPass}
              >
                {loading ? <><div className="fp-spin"></div> Resetting...</> : '🔐 Reset Password'}
              </button>
            </form>
          </div>
        )}

        {/* ── STEP 4 ── */}
        {step === STEP.DONE && (
          <div className="fp-body fp-done">
            <div className="fp-done-icon">🎉</div>
            <h2>Password Reset!</h2>
            <p>Your password has been changed. Redirecting to login...</p>
            <button className="fp-btn" onClick={() => navigate('/login')}>
              🚀 Login Now
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default ForgotPassword;