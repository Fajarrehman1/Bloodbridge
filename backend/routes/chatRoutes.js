const express     = require('express');
const router      = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getInbox,
  getConversation,
  markMessagesRead
} = require('../controllers/chatController');

// ── Direct send (for testing) ─────────────────────────────
router.post('/send', protect, async (req, res) => {
  try {
    const Message            = require('../models/Message');
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({
        message: 'receiverId and content required'
      });
    }
    const msg = await Message.create({
      sender:   req.user._id,
      receiver: receiverId,
      content
    });
    const populated = await msg.populate([
      { path: 'sender',   select: 'name phone bloodGroup' },
      { path: 'receiver', select: 'name phone bloodGroup' }
    ]);
    return res.status(201).json(populated);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// IMPORTANT — /inbox and /send MUST come before /:userId
router.get('/inbox',        protect, getInbox);
router.put('/:userId/read', protect, markMessagesRead);
router.get('/:userId',      protect, getConversation);

module.exports = router;