const RequestResponse = require('../models/RequestResponse');
const BloodRequest    = require('../models/BloodRequest');
const User            = require('../models/User');
const Notification    = require('../models/Notification');

const POINTS = 10;

// ── Confirm Donation ──────────────────────────────────────
exports.confirmDonation = async (req, res) => {
  try {
    const { responseId } = req.params;
    const { hospitalName } = req.body;

    console.log('confirmDonation called:', responseId, 'by user:', req.user._id);

    // Find response WITHOUT populating request yet
    const response = await RequestResponse.findById(responseId)
      .populate('donor', 'name email');

    if (!response) {
      console.log('Response not found:', responseId);
      return res.status(404).json({ message: 'Response not found' });
    }

    console.log('Response found:', response._id, 'status:', response.status);
    console.log('Already confirmed:', response.donationConfirmed);

    // Get the blood request separately
    const bloodRequest = await BloodRequest.findById(response.request);

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Blood request not found' });
    }

    console.log('BloodRequest receiver:', bloodRequest.receiver, 'current user:', req.user._id);

    // Check receiver owns this request
    if (String(bloodRequest.receiver) !== String(req.user._id) &&
        String(bloodRequest.postedBy) !== String(req.user._id)) {
      return res.status(403).json({
        message: 'Only the receiver can confirm this donation'
      });
    }

    if (response.status !== 'accepted') {
      return res.status(400).json({
        message: 'Only accepted responses can be confirmed'
      });
    }

    if (response.donationConfirmed) {
      return res.status(400).json({
        message: 'This donation has already been confirmed'
      });
    }

    // ── Mark confirmed ────────────────────────────────────
    response.donationConfirmed   = true;
    response.donationConfirmedAt = new Date();
    response.donationConfirmedBy = req.user._id;
    response.hospitalName        = hospitalName || '';
    response.pointsAwarded       = true;
    await response.save();

    console.log('✅ Response saved as confirmed');

    // ── Award points to donor ─────────────────────────────
    const updatedDonor = await User.findByIdAndUpdate(
      response.donor._id,
      { $inc: { donationPoints: POINTS, totalDonations: 1 } },
      { new: true }
    );

    console.log('✅ Points awarded to:', updatedDonor?.name, '→ total points:', updatedDonor?.donationPoints);

    // ── Notify donor ──────────────────────────────────────
    try {
      await Notification.create({
        user:    response.donor._id,
        title:   '🎉 Donation Confirmed!',
        message: `Your blood donation has been confirmed! +${POINTS} points awarded. Check the leaderboard! 🏆`,
        type:    'donation_confirmed'
      });
    } catch (notifErr) {
      console.error('Notification error (non-fatal):', notifErr.message);
    }

    return res.json({
      success:  true,
      message:  `Donation confirmed! ${POINTS} points awarded to ${updatedDonor?.name}. 🏆`,
      response,
      donorPoints: updatedDonor?.donationPoints
    });

  } catch (err) {
    console.error('❌ confirmDonation error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Get Pending Confirmations ─────────────────────────────
exports.getPendingConfirmations = async (req, res) => {
  try {
    const responses = await RequestResponse.find({
      status:            'accepted',
      donationConfirmed: false
    })
    .populate('donor', 'name phone bloodGroup city');

    const withRequests = await Promise.all(
      responses.map(async (r) => {
        const req2 = await BloodRequest.findById(r.request);
        if (!req2) return null;
        if (String(req2.receiver || req2.postedBy) !== String(req.user._id)) return null;
        return r;
      })
    );

    const filtered = withRequests.filter(Boolean);
    return res.json({ pending: filtered });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};