const User         = require('../models/User');
const Donor        = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');

exports.getDashboardStats = async (req, res) => {
  try {
    const [totalUsers, totalDonors, totalRequests, openRequests, fulfilledRequests] =
      await Promise.all([
        User.countDocuments(),
        Donor.countDocuments(),
        BloodRequest.countDocuments(),
        BloodRequest.countDocuments({ status: 'open' }),
        BloodRequest.countDocuments({ status: 'fulfilled' })
      ]);
    res.json({ totalUsers, totalDonors, totalRequests, openRequests, fulfilledRequests });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('-createdAt');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Donor.findOneAndDelete({ user: req.params.id });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllDonors = async (req, res) => {
  try {
    const donors = await Donor.find()
      .populate('user', 'name email phone').sort('-createdAt');
    res.json(donors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.toggleDonorAvailability = async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    donor.available = !donor.available;
    await donor.save();
    res.json({
      message: `Donor marked as ${donor.available ? 'available' : 'unavailable'}`,
      donor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllRequests = async (req, res) => {
  try {
    const requests = await BloodRequest.find()
      .populate('postedBy', 'name email phone').sort('-createdAt');
    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteRequest = async (req, res) => {
  try {
    await BloodRequest.findByIdAndDelete(req.params.id);
    res.json({ message: 'Request deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.broadcastNotification = async (req, res) => {
  try {
    const { message, type } = req.body;
    const users = await User.find().select('_id');
    const notifications = users.map(u => ({
      user: u._id, message, type: type || 'system'
    }));
    await Notification.insertMany(notifications);
    res.json({ message: `Broadcast sent to ${users.length} users` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.changeUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { role }, { new: true }
    ).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};