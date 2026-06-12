const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  postedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bloodGroup: { type: String, required: true },
  city:       { type: String, required: true },
  urgency:    { type: String, enum: ['normal','urgent','critical'], default: 'normal' },
  details:    { type: String },
  status:     { type: String, enum: ['open','fulfilled','closed'], default: 'open' },
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', requestSchema);