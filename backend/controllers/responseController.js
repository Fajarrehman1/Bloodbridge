const RequestResponse = require('../models/RequestResponse');
const BloodRequest    = require('../models/BloodRequest');
const Notification    = require('../models/Notification');
const Message         = require('../models/Message');
const User            = require('../models/User');

// ── Donor Responds ────────────────────────────────────────
exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message }   = req.body;

    if (req.user.role !== 'donor') {
      return res.status(403).json({ message: 'Only donors can respond' });
    }

    const bloodRequest = await BloodRequest.findById(requestId)
      .populate('postedBy', 'name phone city _id');

    if (!bloodRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (bloodRequest.status !== 'open') {
      return res.status(400).json({ message: 'Request no longer open' });
    }

    const already = await RequestResponse.findOne({
      request: requestId,
      donor:   req.user._id
    });
    if (already) {
      return res.status(400).json({ message: 'Already responded' });
    }

    // Create response record
    const response = await RequestResponse.create({
      request: requestId,
      donor:   req.user._id,
      message: message || 'I am available to donate blood!',
      phone:   req.user.phone || '',
      city:    req.user.city  || ''
    });

    const receiverId = bloodRequest.postedBy._id;

    // ── Create message so inbox appears immediately ───────
    const introMsg = `👋 Hello! I am ${req.user.name} (Blood Group: ${req.user.bloodGroup}) from ${req.user.city || 'your city'}. I have responded to your ${bloodRequest.bloodGroup} blood request in ${bloodRequest.city}. Please check your responses and accept me if I match!`;

    await Message.create({
      sender:   req.user._id,
      receiver: receiverId,
      content:  introMsg
    });

    console.log(`✅ Message created: donor ${req.user._id} → receiver ${receiverId}`);

    // Notify receiver
    await Notification.create({
      user:    receiverId,
      message: `🩸 ${req.user.name} (${req.user.bloodGroup}) responded to your blood request in ${bloodRequest.city}!`,
      type:    'request'
    });

    return res.status(201).json({
      message:      'Response sent! You can now chat with the receiver.',
      receiverId:   receiverId,
      receiverName: bloodRequest.postedBy.name,
      receiverPhone:bloodRequest.postedBy.phone || '',
      response
    });

  } catch (err) {
    console.error('respondToRequest error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Get Responses for a Request ───────────────────────────
exports.getResponsesForRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const bloodRequest = await BloodRequest.findById(requestId);
    if (!bloodRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    if (String(bloodRequest.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const responses = await RequestResponse.find({ request: requestId })
      .populate('donor', 'name bloodGroup phone city available healthNote')
      .sort('-createdAt');

    return res.json({
      requestId,
      bloodGroup:     bloodRequest.bloodGroup,
      city:           bloodRequest.city,
      urgency:        bloodRequest.urgency,
      status:         bloodRequest.status,
      totalResponses: responses.length,
      responses
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Receiver Accepts Donor ────────────────────────────────
exports.acceptResponse = async (req, res) => {
  try {
    const { responseId } = req.params;

    const response = await RequestResponse.findById(responseId)
      .populate('request')
      .populate('donor', 'name phone bloodGroup city _id');

    if (!response) {
      return res.status(404).json({ message: 'Response not found' });
    }

    if (String(response.request.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    response.status = 'accepted';
    await response.save();

    // Reject all others
    await RequestResponse.updateMany(
      { request: response.request._id, _id: { $ne: responseId } },
      { status: 'rejected' }
    );

    // Mark request fulfilled
    await BloodRequest.findByIdAndUpdate(
      response.request._id,
      { status: 'fulfilled' }
    );

    const donorId   = response.donor._id;
    const donorName = response.donor.name;

    // ── Create acceptance message (receiver → donor) ──────
    const acceptMsg = `✅ Great news, ${donorName}! I have accepted your offer to donate ${response.request.bloodGroup} blood in ${response.request.city}. Thank you so much! Please let me know when you are available to come. 🙏`;

    await Message.create({
      sender:   req.user._id,
      receiver: donorId,
      content:  acceptMsg
    });

    // ── Create reply message (donor → receiver) ───────────
    const replyMsg = `🩸 Thank you for accepting! I will coordinate with you. Please share the hospital name and timing whenever ready.`;

    await Message.create({
      sender:   donorId,
      receiver: req.user._id,
      content:  replyMsg
    });

    console.log(`✅ 2 messages created between receiver ${req.user._id} and donor ${donorId}`);

    // Notify donor
    await Notification.create({
      user:    donorId,
      message: `✅ ${req.user.name} ACCEPTED your blood donation offer! Open chat to coordinate.`,
      type:    'request'
    });

    // Notify rejected donors
    const rejected = await RequestResponse.find({
      request: response.request._id,
      _id:     { $ne: responseId },
      status:  'rejected'
    });

    for (const r of rejected) {
      await Notification.create({
        user:    r.donor,
        message: `Your response was not selected this time. Keep helping!`,
        type:    'request'
      });
    }

    return res.json({
      message:    'Donor accepted! Chat is ready.',
      donorId:    donorId,
      donorName:  donorName,
      donorPhone: response.donor.phone || '',
      response
    });

  } catch (err) {
    console.error('acceptResponse error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Reject Response ───────────────────────────────────────
exports.rejectResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const response = await RequestResponse.findById(responseId)
      .populate('request');

    if (!response) return res.status(404).json({ message: 'Not found' });

    if (String(response.request.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    response.status = 'rejected';
    await response.save();

    await Notification.create({
      user:    response.donor,
      message: `Your response was not selected this time.`,
      type:    'request'
    });

    return res.json({ message: 'Response rejected', response });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Donor Views Own Responses ─────────────────────────────
exports.getMyResponses = async (req, res) => {
  try {
    const responses = await RequestResponse.find({ donor: req.user._id })
      .populate({
        path:     'request',
        select:   'bloodGroup city urgency status details createdAt postedBy',
        populate: { path: 'postedBy', select: 'name phone city _id' }
      })
      .sort('-createdAt');

    return res.json({ totalResponses: responses.length, responses });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Cancel Response ───────────────────────────────────────
exports.cancelMyResponse = async (req, res) => {
  try {
    const { responseId } = req.params;
    const response = await RequestResponse.findById(responseId);
    if (!response) return res.status(404).json({ message: 'Not found' });

    if (String(response.donor) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (response.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot cancel a ${response.status} response`
      });
    }

    await RequestResponse.findByIdAndDelete(responseId);
    return res.json({ message: 'Response cancelled' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Admin: All Responses ──────────────────────────────────
exports.getAllResponses = async (req, res) => {
  try {
    const responses = await RequestResponse.find()
      .populate('donor',   'name bloodGroup phone city')
      .populate('request', 'bloodGroup city urgency status')
      .sort('-createdAt');
    return res.json({ totalResponses: responses.length, responses });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};