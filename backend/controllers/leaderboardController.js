const RequestResponse = require('../models/RequestResponse');
const User            = require('../models/User');
const Review          = require('../models/Review');

// ── Helper: Get blood group compatibility color ───────────
const bloodColor = (bg) => {
  const colors = {
    'A+':'#e74c3c','A-':'#c0392b','B+':'#e67e22','B-':'#d35400',
    'AB+':'#8e44ad','AB-':'#6c3483','O+':'#27ae60','O-':'#1e8449'
  };
  return colors[bg] || '#c0392b';
};

// ── Helper: Calculate donor level ────────────────────────
const getLevel = (donations) => {
  if (donations >= 10) return { label: 'Platinum', icon: '👑', color: '#8e44ad' };
  if (donations >= 5)  return { label: 'Gold',     icon: '🥇', color: '#f39c12' };
  if (donations >= 3)  return { label: 'Silver',   icon: '🥈', color: '#95a5a6' };
  if (donations >= 1)  return { label: 'Bronze',   icon: '🥉', color: '#cd7f32' };
  return                      { label: 'Starter',  icon: '⭐', color: '#888'    };
};

// ── Helper: Get badges ────────────────────────────────────
const getBadges = (donations, bloodGroup, hasEmergency) => {
  const badges = [];
  if (donations >= 1)  badges.push('🩸');
  if (donations >= 3)  badges.push('⭐');
  if (donations >= 5)  badges.push('🥇');
  if (donations >= 10) badges.push('👑');
  if (bloodGroup === 'O-')  badges.push('🌍');
  if (bloodGroup === 'AB+') badges.push('💎');
  if (hasEmergency)         badges.push('🚨');
  return badges;
};

// ── Main Leaderboard ──────────────────────────────────────
exports.getLeaderboard = async (req, res) => {
  try {
    const { period = 'all', city = '', bloodGroup = '' } = req.query;

    // Build date filter
    let dateFilter = {};
    const now = new Date();

    if (period === 'month') {
      dateFilter = {
        createdAt: {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1)
        }
      };
    } else if (period === 'year') {
      dateFilter = {
        createdAt: { $gte: new Date(now.getFullYear(), 0, 1) }
      };
    } else if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    }

    // Aggregate accepted responses per donor
    const pipeline = [
      {
        $match: {
          status: 'accepted',
          ...dateFilter
        }
      },
      {
        $group: {
          _id:           '$donor',
          donations:     { $sum: 1 },
          lastDonation:  { $max: '$createdAt' },
          requests:      { $push: '$request' }
        }
      },
      {
        $lookup: {
          from:         'users',
          localField:   '_id',
          foreignField: '_id',
          as:           'donorInfo'
        }
      },
      {
        $unwind: '$donorInfo'
      },
      {
        $match: {
          'donorInfo.role': 'donor',
          ...(bloodGroup ? { 'donorInfo.bloodGroup': bloodGroup } : {}),
          ...(city ? {
            'donorInfo.city': new RegExp(city, 'i')
          } : {})
        }
      },
      {
        $project: {
          _id:          1,
          donations:    1,
          lastDonation: 1,
          name:        '$donorInfo.name',
          bloodGroup:  '$donorInfo.bloodGroup',
          city:        '$donorInfo.city',
          phone:       '$donorInfo.phone',
          available:   '$donorInfo.available',
          createdAt:   '$donorInfo.createdAt'
        }
      },
      {
        $sort: { donations: -1, lastDonation: -1 }
      },
      {
        $limit: 50
      }
    ];

    const results = await RequestResponse.aggregate(pipeline);

    // Get review data for top donors
    const donorIds   = results.map(r => r._id);
    const reviews    = await Review.find({ donor: { $in: donorIds } })
      .select('donor rating');

    // Map reviews to donors
    const reviewMap = {};
    reviews.forEach(r => {
      const did = String(r.donor);
      if (!reviewMap[did]) reviewMap[did] = { total: 0, sum: 0 };
      reviewMap[did].total++;
      reviewMap[did].sum += r.rating;
    });

    // Check emergency responses
    const emergencyResponses = await RequestResponse.find({
      donor:  { $in: donorIds },
      status: 'accepted'
    }).populate('request', 'urgency');

    const emergencyMap = {};
    emergencyResponses.forEach(r => {
      if (r.request?.urgency === 'critical') {
        emergencyMap[String(r.donor)] = true;
      }
    });

    // Build final leaderboard
    const leaderboard = results.map((donor, i) => {
      const did     = String(donor._id);
      const rev     = reviewMap[did];
      const avgRating = rev
        ? parseFloat((rev.sum / rev.total).toFixed(1))
        : 0;
      const points    = (donor.donations * 10) +
                        (avgRating >= 4 ? 5 : 0) +
                        (emergencyMap[did] ? 10 : 0);
      const level     = getLevel(donor.donations);
      const badges    = getBadges(
        donor.donations,
        donor.bloodGroup,
        emergencyMap[did]
      );

      return {
        rank:         i + 1,
        _id:          donor._id,
        name:         donor.name,
        bloodGroup:   donor.bloodGroup,
        city:         donor.city,
        available:    donor.available,
        donations:    donor.donations,
        points,
        avgRating,
        totalReviews: rev?.total || 0,
        lastDonation: donor.lastDonation,
        level,
        badges,
        memberSince:  donor.createdAt
      };
    });

    // Re-sort by points
    leaderboard.sort((a, b) => b.points - a.points || b.donations - a.donations);
    leaderboard.forEach((d, i) => { d.rank = i + 1; });

    // Stats
// Stats
const totalDonors    = await User.countDocuments({ role: 'donor' });
const totalDonations = await RequestResponse.countDocuments({
  status: 'accepted'
});

const bloodGroupStats = await RequestResponse.aggregate([
  { $match: { status: 'accepted' } },
  {
    $lookup: {
      from:         'users',
      localField:   'donor',
      foreignField: '_id',
      as:           'donorInfo'
    }
  },
  { $unwind: { path: '$donorInfo', preserveNullAndEmpty: false } },
  {
    $group: {
      _id:   '$donorInfo.bloodGroup',
      count: { $sum: 1 }
    }
  },
  { $match: { _id: { $ne: null } } },
  { $sort: { count: -1 } }
]);

return res.json({
  leaderboard,
  stats: {
    totalDonors:        totalDonors        || 0,
    totalDonations:     totalDonations     || 0,
    totalOnLeaderboard: leaderboard.length || 0,
    bloodGroupStats:    bloodGroupStats    || []
  }
});

  } catch (err) {
    console.error('getLeaderboard error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ── Get Single Donor Rank ─────────────────────────────────
exports.getMyRank = async (req, res) => {
  try {
    const donorId = req.user._id;

    const myDonations = await RequestResponse.countDocuments({
      donor:  donorId,
      status: 'accepted'
    });

    const higherCount = await RequestResponse.aggregate([
      { $match: { status: 'accepted' } },
      { $group: { _id: '$donor', count: { $sum: 1 } } },
      { $match: { count: { $gt: myDonations } } },
      { $count: 'total' }
    ]);

    const rank = (higherCount[0]?.total || 0) + 1;

    return res.json({
      rank,
      donations: myDonations,
      points:    myDonations * 10,
      level:     getLevel(myDonations)
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};