const router = require('express').Router();
const { protect } = require('../middleware/authMiddleware');
const { registerDonor, getDonors, updateDonor } = require('../controllers/donorController');

router.get('/',    getDonors);
router.post('/',   protect, registerDonor);
router.put('/me',  protect, updateDonor);

// ── Get single donor by ID (public profile) ───────────────
router.get('/:donorId', async (req, res) => {
  try {
    const User  = require('../models/User');
    const donor = await User.findOne({
      _id:  req.params.donorId,
      role: 'donor'
    }).select('-password -__v');

    if (!donor) {
      return res.status(404).json({ message: 'Donor not found' });
    }
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;