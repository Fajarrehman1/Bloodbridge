const User = require('../models/User');

exports.getDonors = async (req, res) => {
  try {
    const { bloodGroup, city, available } = req.query;
    const filter = {};

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city)       filter.city       = new RegExp(city, 'i');
    // Only filter by available if explicitly requested
    if (available === 'true')  filter.available = true;
    if (available === 'false') filter.available = false;

    const donors = await User.find({
      role: 'donor',
      ...filter
    }).select('-password').sort('-createdAt');

    console.log(`✅ getDonors: returning ${donors.length} donors`);
    res.json(donors);
  } catch (err) {
    console.error('getDonors error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateDonor = async (req, res) => {
  try {
    const donor = await User.findByIdAndUpdate(
      req.user._id,
      req.body,
      { new: true }
    ).select('-password -resetOTP -resetOTPExpiry');

    res.json(donor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.registerDonor = async (req, res) => {
  try {
    const donor = await User.findByIdAndUpdate(
      req.user._id,
      {
        bloodGroup: req.body.bloodGroup,
        city:       req.body.city,
        available:  req.body.available,
        healthNote: req.body.healthNote
      },
      { new: true }
    ).select('-password -resetOTP -resetOTPExpiry');

    res.json(donor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};