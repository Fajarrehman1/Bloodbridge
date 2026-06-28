const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  confirmDonation,
  getPendingConfirmations
} = require('../controllers/donationController');

router.post('/confirm/:responseId',   protect, confirmDonation);
router.get('/pending-confirmations',  protect, getPendingConfirmations);

module.exports = router;