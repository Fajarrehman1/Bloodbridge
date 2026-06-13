const express = require('express');
const router  = express.Router();
const User    = require('../models/User');
const jwt     = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ─── Register General ─────────────────────────────────────
router.post('/register', async (req, res) => {
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
});

// ─── Register Donor ───────────────────────────────────────
router.post('/register-donor', async (req, res) => {
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
      name, email, password, phone,
      role:       'donor',
      bloodGroup, city,
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
});

// ─── Register Receiver ────────────────────────────────────
router.post('/register-receiver', async (req, res) => {
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
      name, email, password, phone, city, role: 'receiver'
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
});

// ─── Register Admin ───────────────────────────────────────
router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, phone, adminSecretKey } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: 'Required: name, email, password'
      });
    }

    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const user = await User.create({
      name, email, password, phone, role: 'admin'
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
});

// ─── Login ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }
    const isMatch = await user.matchPassword(password);
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
});

// ─── Forgot Password ──────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Use Math.random instead of crypto
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOTP       = otp;
    user.resetOTPExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ OTP for ${email}: ${otp}`);

    return res.json({ message: 'OTP generated successfully', otp, devOtp: otp });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Verify OTP ────────────────────────────────────────────
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(400).json({ message: 'No account found' });
    }

    if (!user.resetOTP || user.resetOTP !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date(user.resetOTPExpiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    return res.json({ message: 'OTP verified!', verified: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Reset Password ────────────────────────────────────────
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        message: 'Email, OTP and new password are required'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    if (!user.resetOTP || user.resetOTP !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date(user.resetOTPExpiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    user.password       = newPassword;
    user.resetOTP       = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    console.log('✅ Password reset for:', email);
    return res.json({ message: 'Password reset successfully! You can now login.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ─── Blood Match ──────────────────────────────────────────
router.get('/match-donors', async (req, res) => {
  try {
    let { bloodGroup, city } = req.query;

    if (!bloodGroup) {
      return res.status(400).json({ message: 'bloodGroup is required' });
    }

    bloodGroup = bloodGroup.trim().replace(' ', '+');

    const compatibleGroups = {
      'A+':  ['A+', 'A-', 'O+', 'O-'],
      'A-':  ['A-', 'O-'],
      'B+':  ['B+', 'B-', 'O+', 'O-'],
      'B-':  ['B-', 'O-'],
      'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      'AB-': ['A-', 'B-', 'AB-', 'O-'],
      'O+':  ['O+', 'O-'],
      'O-':  ['O-']
    };

    const compatible = compatibleGroups[bloodGroup];
    if (!compatible) {
      return res.status(400).json({ message: `Invalid blood group "${bloodGroup}"` });
    }

    const filter = {
      role:       'donor',
      available:  true,
      bloodGroup: { $in: compatible }
    };

    if (city) filter.city = new RegExp(city, 'i');

    const donors = await User.find(filter)
      .select('-password -resetOTP -resetOTPExpiry')
      .sort('bloodGroup');

    const grouped = {};
    donors.forEach(donor => {
      if (!grouped[donor.bloodGroup]) grouped[donor.bloodGroup] = [];
      grouped[donor.bloodGroup].push({
        _id: donor._id, name: donor.name,
        phone: donor.phone, city: donor.city,
        bloodGroup: donor.bloodGroup,
        available: donor.available,
        healthNote: donor.healthNote
      });
    });

    return res.json({
      receiverBloodGroup:    bloodGroup,
      compatibleBloodGroups: compatible,
      city:                  city || 'All Cities',
      totalMatches:          donors.length,
      donors:                grouped
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;