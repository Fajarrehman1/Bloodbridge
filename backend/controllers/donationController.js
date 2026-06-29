const RequestResponse = require('../models/RequestResponse');
const BloodRequest    = require('../models/BloodRequest');
const User            = require('../models/User');
const Notification    = require('../models/Notification');

const POINTS = 10;

exports.confirmDonation = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { hospitalName } = req.body;

    console.log('confirmDonation called:', responseId, 'by:', req.user._id);

    const response = await RequestResponse.findById(responseId)
      .populate('donor', 'name email');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    if (response.status !== 'accepted') {
      return res.status(400).json({ message: 'Only accepted responses can be confirmed' });
    }

    if (response.donationConfirmed) {
      return res.status(400).json({ message: 'Donation already confirmed' });
    }

    const bloodRequest = await BloodRequest.findById(response.request);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    const receiverId = String(bloodRequest.receiver || bloodRequest.postedBy);
    if (receiverId !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the receiver can confirm this donation' });
    }

    response.donationConfirmed   = true;
    response.donationConfirmedAt = new Date();
    response.donationConfirmedBy = req.user._id;
    response.hospitalName        = hospitalName || '';
    response.pointsAwarded       = true;
    await response.save();

    const updatedDonor = await User.findByIdAndUpdate(
      response.donor._id,
      { $inc: { donationPoints: POINTS, totalDonations: 1 } },
      { new: true }
    );

    console.log('Points awarded to:', updatedDonor?.name, '→', updatedDonor?.donationPoints);

    try {
      await Notification.create({
        user:    response.donor._id,
        title:   '🎉 Donation Confirmed!',
        message: `Your donation was confirmed! +${POINTS} points. Check the leaderboard! 🏆`,
        type:    'donation_confirmed'
      });
    } catch (e) {
      console.error('Notification error (non-fatal):', e.message);
    }

    return res.json({
      success:     true,
      message:     `Donation confirmed! ${POINTS} points awarded to ${updatedDonor?.name}. 🏆`,
      response,
      donorPoints: updatedDonor?.donationPoints
    });

  } catch (err) {
    console.error('confirmDonation error:', err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getPendingConfirmations = async (req, res) => {
  try {
    const responses = await RequestResponse.find({
      status:            'accepted',
      donationConfirmed: false
    }).populate('donor', 'name phone bloodGroup city');

    const filtered = [];
    for (const r of responses) {
      const req2 = await BloodRequest.findById(r.request);
      if (!req2) continue;
      const rid = String(req2.receiver || req2.postedBy);
      if (rid === String(req.user._id)) filtered.push(r);
    }

    return res.json({ pending: filtered });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};