const BloodRequest = require('../models/BloodRequest');
const User         = require('../models/User');
const Notification = require('../models/Notification');

exports.createRequest = async (req, res) => {
  try {
    const request = await BloodRequest.create({
      postedBy: req.user._id, ...req.body
    });

    // Find matching donors from users collection
    const matchingDonors = await User.find({
      role:       'donor',
      bloodGroup: request.bloodGroup,
      city:       new RegExp(request.city, 'i'),
      available:  true
    });

    const notifications = matchingDonors.map(donor => ({
      user:    donor._id,
      message: `Urgent! A ${request.bloodGroup} blood request in ${request.city}.`,
      type:    'request'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getRequests = async (req, res) => {
  try {
    const { bloodGroup, city, urgency } = req.query;
    const filter = { status: 'open' };
    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city)       filter.city = new RegExp(city, 'i');
    if (urgency)    filter.urgency = urgency;

    const requests = await BloodRequest.find(filter)
      .populate('postedBy', 'name phone city')
      .sort('-createdAt');

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.closeRequest = async (req, res) => {
  try {
    const request = await BloodRequest.findByIdAndUpdate(
      req.params.id,
      { status: 'fulfilled' },
      { new: true }
    );
    res.json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Get My Posted Requests (Receiver) — ALL statuses ────────
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find({ postedBy: req.user._id })
      .populate('postedBy', 'name phone city')
      .sort('-createdAt');
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};