const Bookmark = require('../models/Bookmark');
const User     = require('../models/User');

// ── Add Bookmark ──────────────────────────────────────────
exports.addBookmark = async (req, res) => {
  try {
    const { donorId } = req.body;

    if (!donorId) {
      return res.status(400).json({ message: 'donorId is required' });
    }

    // Check donor exists
    const donor = await User.findById(donorId);
    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }

    // Check already bookmarked
    const exists = await Bookmark.findOne({
      user:  req.user._id,
      donor: donorId
    });
    if (exists) {
      return res.status(400).json({ message: 'Already bookmarked' });
    }

    const bookmark = await Bookmark.create({
      user:  req.user._id,
      donor: donorId
    });

    // Populate before returning
    const populated = await Bookmark.findById(bookmark._id)
      .populate('donor', 'name phone email bloodGroup city available healthNote');

    return res.status(201).json(populated);
  } catch (err) {
    console.error('addBookmark error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Get All Bookmarks ─────────────────────────────────────
exports.getBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate('donor', 'name phone email bloodGroup city available healthNote')
      .sort('-createdAt');
    return res.json(bookmarks);
  } catch (err) {
    console.error('getBookmarks error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Remove Bookmark ───────────────────────────────────────
exports.removeBookmark = async (req, res) => {
  try {
    const { donorId } = req.params;
    await Bookmark.findOneAndDelete({
      user:  req.user._id,
      donor: donorId
    });
    return res.json({ message: 'Bookmark removed' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// ── Check if Bookmarked ───────────────────────────────────
exports.isBookmarked = async (req, res) => {
  try {
    const { donorId } = req.params;
    const exists = await Bookmark.findOne({
      user:  req.user._id,
      donor: donorId
    });
    return res.json({ bookmarked: !!exists });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};