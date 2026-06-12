const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  type:    { type: String, enum: ['request','chat','system'], default: 'system' },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);