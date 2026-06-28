const User = require('../models/User');

const getLevel = (points) => {
  if (points >= 100) return { label: 'Platinum', icon: '👑', color: '#8e44ad' };
  if (points >= 50)  return { label: 'Gold',     icon: '🥇', color: '#f39c12' };
  if (points >= 30)  return { label: 'Silver',   icon: '🥈', color: '#95a5a6' };
  if (points >= 10)  return { label: 'Bronze',   icon: '🥉', color: '#cd7f32' };
  return                    { label: 'Starter',  icon: '⭐', color: '#888'    };
};

exports.getLeaderboard = async (req, res) => {
  try {
    const { bloodGroup = '', city = '' } = req.query;

    const filter = {
      role:           'donor',
      donationPoints: { $gt: 0 }
    };

    if (bloodGroup) filter.bloodGroup = bloodGroup;
    if (city)       filter.city       = new RegExp(city, 'i');

    const donors = await User.find(filter)
      .select('-password -resetOTP -resetOTPExpiry')
      .sort({ donationPoints: -1, totalDonations: -1 })
      .limit(50);

    const leaderboard = donors.map((donor, i) => ({
      rank:        i + 1,
      _id:         donor._id,
      name:        donor.name,
      bloodGroup:  donor.bloodGroup,
      city:        donor.city        || '',
      available:   donor.available,
      points:      donor.donationPoints  || 0,
      donations:   donor.totalDonations  || 0,
      level:       getLevel(donor.donationPoints || 0),
      badge:       i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '⭐',
      achievement: (donor.totalDonations || 0) >= 10 ? 'Gold Donor'    :
                   (donor.totalDonations || 0) >= 5  ? 'Regular Donor' :
                   (donor.totalDonations || 0) >= 1  ? 'Active Donor'  : ''
    }));

    const totalDonors = await User.countDocuments({ role: 'donor' });

    const totals = await User.aggregate([
      { $match: { role: 'donor' } },
      { $group: { _id: null, total: { $sum: '$totalDonations' } } }
    ]);

    const bloodGroupStats = await User.aggregate([
      { $match: { role: 'donor', donationPoints: { $gt: 0 } } },
      { $group: { _id: '$bloodGroup', count: { $sum: '$totalDonations' } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } }
    ]);

    return res.json({
      leaderboard,
      stats: {
        totalDonors,
        totalDonations:     totals[0]?.total || 0,
        totalOnLeaderboard: leaderboard.length,
        bloodGroupStats
      }
    });

  } catch (err) {
    console.error('getLeaderboard error:', err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyRank = async (req, res) => {
  try {
    const donor    = await User.findById(req.user._id);
    if (!donor) return res.status(404).json({ message: 'User not found' });

    const myPoints = donor.donationPoints || 0;

    const higherCount = await User.countDocuments({
      role:           'donor',
      donationPoints: { $gt: myPoints }
    });

    return res.json({
      rank:      higherCount + 1,
      points:    myPoints,
      donations: donor.totalDonations || 0,
      level:     getLevel(myPoints)
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};