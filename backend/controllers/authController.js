const User = require('../models/User');
const jwt  = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// ── Register General ──────────────────────────────────────
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all required fields' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, role, phone });
    return res.status(201).json({
      _id: user._id, name: user.name,
      role: user.role, token: generateToken(user._id)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Register Donor ────────────────────────────────────────
exports.registerDonor = async (req, res) => {
  try {
    const { name, email, password, phone, bloodGroup, city, available, healthNote } = req.body;
    if (!name || !email || !password || !bloodGroup || !city) {
      return res.status(400).json({ message: 'Required: name, email, password, bloodGroup, city' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({
      name, email, password, phone,
      role: 'donor', bloodGroup, city,
      available: available !== undefined ? available : true,
      healthNote: healthNote || ''
    });
    return res.status(201).json({
      message: 'Donor registered successfully',
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role,
      bloodGroup: user.bloodGroup, city: user.city,
      available: user.available, token: generateToken(user._id)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Register Receiver ─────────────────────────────────────
exports.registerReceiver = async (req, res) => {
  try {
    const { name, email, password, phone, city } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Required: name, email, password' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, city, role: 'receiver' });
    return res.status(201).json({
      message: 'Receiver registered successfully',
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, city: user.city,
      role: user.role, token: generateToken(user._id)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Register Admin ────────────────────────────────────────
exports.registerAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, adminSecretKey } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Required: name, email, password' });
    }
    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, phone, role: 'admin' });
    return res.status(201).json({
      message: 'Admin registered successfully',
      _id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, token: generateToken(user._id)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Login ─────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
    return res.json({
      _id: user._id, name: user.name, email: user.email,
      role: user.role, bloodGroup: user.bloodGroup,
      city: user.city, available: user.available,
      phone: user.phone, token: generateToken(user._id)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Forgot Password ───────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    // Generate OTP without crypto module
    const otp    = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    user.resetOTP       = otp;
    user.resetOTPExpiry = expiry;
    await user.save({ validateBeforeSave: false });

    console.log(`✅ OTP for ${email}: ${otp}`);

    return res.json({ message: 'OTP generated!', otp, devOtp: otp });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Verify OTP ────────────────────────────────────────────
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: 'Email and OTP required' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ message: 'No account found' });

    if (!user.resetOTP || user.resetOTP !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date(user.resetOTPExpiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // DO NOT clear OTP — needed for reset-password
    return res.json({ message: 'OTP verified!', verified: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Reset Password ────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: 'Email, OTP and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'No account found' });

    if (!user.resetOTP || user.resetOTP !== otp.toString().trim()) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    if (new Date(user.resetOTPExpiry) < new Date()) {
      return res.status(400).json({ message: 'OTP has expired' });
    }

    // Hash and save password
    user.password       = newPassword;
    user.resetOTP       = undefined;
    user.resetOTPExpiry = undefined;
    await user.save();

    console.log(`✅ Password reset for: ${email}`);
    return res.json({ message: 'Password reset successfully! You can now login.' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Match Donors ──────────────────────────────────────────
exports.matchDonors = async (req, res) => {
  try {
    let { bloodGroup, city } = req.query;
    if (!bloodGroup) return res.status(400).json({ message: 'bloodGroup is required' });

    bloodGroup = bloodGroup.trim().replace(' ', '+');

    const compatibleGroups = {
      'A+':  ['A+','A-','O+','O-'],
      'A-':  ['A-','O-'],
      'B+':  ['B+','B-','O+','O-'],
      'B-':  ['B-','O-'],
      'AB+': ['A+','A-','B+','B-','AB+','AB-','O+','O-'],
      'AB-': ['A-','B-','AB-','O-'],
      'O+':  ['O+','O-'],
      'O-':  ['O-']
    };

    const compatible = compatibleGroups[bloodGroup];
    if (!compatible) return res.status(400).json({ message: `Invalid blood group` });

    const filter = { role: 'donor', available: true, bloodGroup: { $in: compatible } };
    if (city) filter.city = new RegExp(city, 'i');

    const donors = await User.find(filter)
      .select('-password -resetOTP -resetOTPExpiry')
      .sort('bloodGroup');

    return res.json({
      receiverBloodGroup:    bloodGroup,
      compatibleBloodGroups: compatible,
      totalMatches:          donors.length,
      donors
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};