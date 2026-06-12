const User      = require('../models/User');
const jwt       = require('jsonwebtoken');
const bcrypt    = require('bcryptjs');
const { sendEmail } = require('../config/mailer');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Store OTPs in memory (use Redis in production) ────────
const otpStore = new Map();

// ─── Register Admin ───────────────────────────────────────
exports.registerAdmin = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      adminSecretKey
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Required: name, email, password'
      });
    }

    // Check secret key
    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({
        message: 'Invalid admin secret key'
      });
    }

    // Check if email already exists
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Create admin user
    const user = await User.create({
      name,
      email,
      password,
      phone,
      role: 'admin'
    });

    return res.status(201).json({
      message: 'Admin registered successfully',
      _id:     user._id,
      name:    user.name,
      email:   user.email,
      phone:   user.phone,
      role:    user.role,
      token:   generateToken(user._id)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Register General ─────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password, role, phone });
    return res.status(201).json({
      _id:   user._id,
      name:  user.name,
      role:  user.role,
      token: generateToken(user._id)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Login ────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email });
    console.log('User found:', user ? user.email : 'NOT FOUND');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }

    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials - wrong password' });
    }

    return res.json({
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      bloodGroup: user.bloodGroup,
      city:       user.city,
      available:  user.available,
      phone:      user.phone,
      token:      generateToken(user._id)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Register Donor ───────────────────────────────────────
exports.registerDonor = async (req, res) => {
  try {
    const {
      name, email, password, phone,
      bloodGroup, city, available, healthNote
    } = req.body;

    if (!name || !email || !password || !bloodGroup || !city) {
      return res.status(400).json({
        message: 'Required: name, email, password, bloodGroup, city'
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      role:       'donor',
      bloodGroup,
      city,
      available:  available !== undefined ? available : true,
      healthNote: healthNote || ''
    });

    return res.status(201).json({
      message:    'Donor registered successfully',
      _id:        user._id,
      name:       user.name,
      email:      user.email,
      phone:      user.phone,
      role:       user.role,
      bloodGroup: user.bloodGroup,
      city:       user.city,
      available:  user.available,
      token:      generateToken(user._id)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ─── Register Receiver ────────────────────────────────────
exports.registerReceiver = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Required: name, email, password'
      });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name,
      email,
      password,
      phone,
      city,
      role: 'receiver'
    });

    return res.status(201).json({
      message: 'Receiver registered successfully',
      _id:     user._id,
      name:    user.name,
      email:   user.email,
      phone:   user.phone,
      city:    user.city,
      role:    user.role,
      token:   generateToken(user._id)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Forgot Password ───────────────────────────────────────
// ── Forgot Password ───────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate OTP and save to User model
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOTP       = otp;
    user.resetOTPExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ OTP for ${email}: ${otp}`);

    return res.json({
      message: 'OTP generated!',
      otp,
      devOtp: otp
    });

  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// ── Verify OTP ────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(400).json({ message: 'No account found' });
    }

    console.log(`OTP check — stored: "${user.resetOTP}" submitted: "${otp.toString().trim()}"`);

    if (!user.resetOTP) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (user.resetOTP !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please try again.' });
    }

    if (new Date(user.resetOTPExpiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
    }

    // Generate reset token
    const jwt        = require('jsonwebtoken');
    const resetToken = jwt.sign(
      { userId: user._id, purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Clear OTP after successful verify
    user.resetOTP       = undefined;
    user.resetOTPExpiry = undefined;
    await user.save({ validateBeforeSave: false });

    return res.json({
      message:    'OTP verified!',
      resetToken
    });

  } catch (err) {
    console.error('verifyOTP error:', err);
    return res.status(500).json({ message: err.message });
  }
});

// ── Reset Password ────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword, confirmPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: 'Reset token and new password required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (confirmPassword && newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Verify JWT token ONLY — no OTP check here
    const jwt = require('jsonwebtoken');
    let decoded;
    try {
      decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(400).json({
        message: 'Reset session expired. Please start again.'
      });
    }

    if (decoded.purpose !== 'reset') {
      return res.status(400).json({ message: 'Invalid reset token' });
    }

    // Hash and save new password
    const bcrypt = require('bcryptjs');
    const hashed = await bcrypt.hash(newPassword, 12);

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { password: hashed },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✅ Password reset for: ${user.email}`);

    return res.json({ message: 'Password reset successful! You can now login.' });

  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: err.message });
  }
});
    // Hash new password
    const hashed = await bcrypt.hash(newPassword, 12);

    // Update user
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { password: hashed },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Clear OTP
    otpStore.delete(user.email);

    // Send confirmation email
    await sendEmail({
      to:      user.email,
      subject: '✅ Password Changed — BloodBridge',
      html: `
        <div style="font-family: Segoe UI, Arial, sans-serif; max-width:480px; margin:40px auto; background:white; border-radius:14px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">
          <div style="background:linear-gradient(135deg,#27ae60,#1e8449); padding:28px; text-align:center;">
            <h1 style="color:white; margin:0; font-size:24px;">✅ Password Changed</h1>
          </div>
          <div style="padding:28px; text-align:center;">
            <p style="color:#555; font-size:15px; line-height:1.6;">
              Hello <strong>${user.name}</strong>,<br><br>
              Your BloodBridge password has been changed successfully.
              You can now log in with your new password.
            </p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
               style="display:inline-block; background:#c0392b; color:white; padding:13px 28px; border-radius:8px; text-decoration:none; font-weight:700; margin-top:16px;">
              Login Now
            </a>
            <div style="background:#fff9e6; border:1px solid #ffe082; border-radius:8px; padding:12px 16px; font-size:13px; color:#856404; margin-top:20px;">
              ⚠️ If you did not make this change, contact us immediately.
            </div>
          </div>
          <div style="background:#1a1a2e; padding:16px; text-align:center; color:#888; font-size:12px;">
            <span style="color:#c0392b; font-weight:700;">🩸 BloodBridge</span> — Pakistan Blood Donation Network
          </div>
        </div>
      `
    });

    return res.json({
      message: 'Password reset successful! You can now login.'
    });

try {
    // some code
} catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ message: err.message });
}