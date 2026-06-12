const mongoose = require('mongoose');

const requestResponseSchema = new mongoose.Schema({
  request:   { type: mongoose.Schema.Types.ObjectId, ref: 'BloodRequest', required: true },
  donor:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message:   { type: String, default: 'I am available to donate blood' },
  status:    { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  phone:     { type: String },
  city:      { type: String },
}, { timestamps: true });

module.exports = mongoose.model('RequestResponse', requestResponseSchema);