const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/authMiddleware');

// ── Submit Review ─────────────────────────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const Review      = require('../models/Review');
    const RequestResponse = require('../models/RequestResponse');
    const User        = require('../models/User');

    const { donorId, requestId, rating, comment, tags, anonymous } = req.body;

    if (!donorId || !rating) {
      return res.status(400).json({ message: 'donorId and rating are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const response = await RequestResponse.findOne({
      donor:   donorId,
      request: requestId,
      status:  'accepted'
    });

    if (!response) {
      return res.status(403).json({
        message: 'You can only review donors whose response you accepted'
      });
    }

    const exists = await Review.findOne({
      donor:    donorId,
      receiver: req.user._id,
      request:  requestId
    });

    if (exists) {
      return res.status(400).json({ message: 'You have already reviewed this donor' });
    }

    const review = await Review.create({
      donor:     donorId,
      receiver:  req.user._id,
      request:   requestId,
      rating,
      comment:   comment || '',
      tags:      tags    || [],
      anonymous: anonymous || false
    });

    // Update donor average rating
    const allReviews = await Review.find({ donor: donorId });
    const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
    await User.findByIdAndUpdate(donorId, {
      averageRating: parseFloat(avg.toFixed(1)),
      totalReviews:  allReviews.length
    });

    const populated = await Review.findById(review._id)
      .populate('receiver', 'name')
      .populate('donor',    'name bloodGroup');

    return res.status(201).json({
      message: 'Review submitted successfully!',
      review:  populated
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Get Reviews for Donor ─────────────────────────────────
router.get('/donor/:donorId', async (req, res) => {
  try {
    const Review = require('../models/Review');
    const { donorId } = req.params;

    const reviews = await Review.find({ donor: donorId })
      .populate('receiver', 'name city')
      .populate('request',  'bloodGroup city createdAt')
      .sort('-createdAt');

    const total   = reviews.length;
    const average = total > 0
      ? parseFloat((reviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1))
      : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { distribution[r.rating]++; });

    const allTags = {};
    reviews.forEach(r => {
      r.tags.forEach(tag => {
        allTags[tag] = (allTags[tag] || 0) + 1;
      });
    });

    return res.json({
      total, average, distribution,
      topTags: Object.entries(allTags)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([tag, count]) => ({ tag, count })),
      reviews
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Check if Can Review ───────────────────────────────────
router.get('/can-review/:donorId/:requestId', protect, async (req, res) => {
  try {
    const Review          = require('../models/Review');
    const RequestResponse = require('../models/RequestResponse');
    const { donorId, requestId } = req.params;

    const response = await RequestResponse.findOne({
      donor:   donorId,
      request: requestId,
      status:  'accepted'
    });

    if (!response) {
      return res.json({ canReview: false, reason: 'No accepted response' });
    }

    const exists = await Review.findOne({
      donor:    donorId,
      receiver: req.user._id,
      request:  requestId
    });

    if (exists) {
      return res.json({ canReview: false, reason: 'Already reviewed', existingReview: exists });
    }

    return res.json({ canReview: true });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Get My Reviews ────────────────────────────────────────
router.get('/my-reviews', protect, async (req, res) => {
  try {
    const Review = require('../models/Review');
    const reviews = await Review.find({ receiver: req.user._id })
      .populate('donor',   'name bloodGroup city')
      .populate('request', 'bloodGroup city')
      .sort('-createdAt');
    return res.json(reviews);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// ── Delete Review ─────────────────────────────────────────
router.delete('/:reviewId', protect, async (req, res) => {
  try {
    const Review = require('../models/Review');
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (String(review.receiver) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await Review.findByIdAndDelete(req.params.reviewId);
    return res.json({ message: 'Review deleted' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;