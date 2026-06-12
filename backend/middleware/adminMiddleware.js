const adminOnly = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'admin') return next();
    res.status(403).json({ message: 'Admin access only' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { adminOnly };