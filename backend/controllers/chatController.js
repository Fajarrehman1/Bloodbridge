const Message = require('../models/Message');

// ── Get Inbox ─────────────────────────────────────────────
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [
        { sender:   userId },
        { receiver: userId }
      ]
    })
    .sort('-createdAt')
    .populate('sender',   'name phone bloodGroup city')
    .populate('receiver', 'name phone bloodGroup city');

    // Deduplicate — one entry per conversation partner
    const seen = new Map();

    for (const msg of messages) {
      // Skip if populate failed
      if (!msg.sender || !msg.receiver) continue;

      const sid = String(msg.sender._id || msg.sender);
      const rid = String(msg.receiver._id || msg.receiver);
      const uid = String(userId);

      const otherId = sid === uid ? rid : sid;

      if (!seen.has(otherId)) {
        seen.set(otherId, msg);
      }
    }

    const inbox = Array.from(seen.values());

    console.log(`✅ Inbox for ${userId}: ${inbox.length} conversations`);
    return res.json(inbox);

  } catch (err) {
    console.error('getInbox error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Get Conversation ──────────────────────────────────────
exports.getConversation = async (req, res) => {
  try {
    const myId    = req.user._id;
    const otherId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: myId,    receiver: otherId },
        { sender: otherId, receiver: myId    }
      ]
    })
    .populate('sender',   'name phone bloodGroup')
    .populate('receiver', 'name phone bloodGroup')
    .sort('createdAt');

    return res.json(messages);
  } catch (err) {
    console.error('getConversation error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Mark as Read ──────────────────────────────────────────
exports.markMessagesRead = async (req, res) => {
  try {
    await Message.updateMany(
      { sender: req.params.userId, receiver: req.user._id, read: false },
      { read: true }
    );
    return res.json({ message: 'Marked as read' });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};