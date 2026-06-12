const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const {
  respondToRequest,
  getResponsesForRequest,
  acceptResponse,
  rejectResponse,
  getMyResponses,
  cancelMyResponse,
  getAllResponses
} = require('../controllers/responseController');

// ─── Donor Routes ─────────────────────────────────────────
// Donor responds to a blood request
router.post('/respond/:requestId',    protect, respondToRequest);

// Donor views their own responses
router.get('/my-responses',           protect, getMyResponses);

// Donor cancels their response
router.delete('/cancel/:responseId',  protect, cancelMyResponse);

// ─── Receiver Routes ──────────────────────────────────────
// Receiver sees all responses to their request
router.get('/request/:requestId',     protect, getResponsesForRequest);

// Receiver accepts a donor
router.put('/accept/:responseId',     protect, acceptResponse);

// Receiver rejects a donor
router.put('/reject/:responseId',     protect, rejectResponse);

// ─── Admin Routes ─────────────────────────────────────────
// Admin sees all responses
router.get('/all',   protect, adminOnly, getAllResponses);

// ── Public donor history ──────────────────────────────────
router.get('/donor/:donorId/public', async (req, res) => {
  try {
    const RequestResponse = require('../models/RequestResponse');
    const responses = await RequestResponse.find({
      donor: req.params.donorId
    })
    .populate('request', 'bloodGroup city urgency details status createdAt')
    .sort('-createdAt')
    .limit(20);

    res.json({ responses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;