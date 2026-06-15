const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  donor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  request:   { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest' },
  rating:    { type: Number, required: true, min: 1, max: 5 },
  comment:   { type: String, default: '' },
  tags:      [{ type: String }],
  anonymous: { type: Boolean, default: false }
}, { timestamps: true });

reviewSchema.index({ donor: 1, receiver: 1, request: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);