require('dotenv').config();
const mongoose = require('mongoose');
const User     = require('./models/User');
const RequestResponse = require('./models/RequestResponse');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bloodbridge')
  .then(async () => {
    console.log('Connected to MongoDB');

    const donors = await User.find({ role: 'donor' });

    for (const donor of donors) {
      // Count confirmed donations for this donor
      const confirmedCount = await RequestResponse.countDocuments({
        donor:             donor._id,
        status:            'accepted',
        donationConfirmed: true
      });

      // Also count accepted (even if donationConfirmed not set)
      // for donors who donated before the confirmation system
      const acceptedCount = await RequestResponse.countDocuments({
        donor:  donor._id,
        status: 'accepted'
      });

      const donations = Math.max(confirmedCount, donor.totalDonations || 0);
      const points    = donations * 10;

      await User.findByIdAndUpdate(donor._id, {
        totalDonations: donations,
        donationPoints: points
      });

      console.log(`✅ ${donor.name}: ${donations} donations → ${points} points`);
    }

    console.log('Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });