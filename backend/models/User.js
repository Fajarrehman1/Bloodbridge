const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  email:          { type: String, required: true, unique: true },
  password:       { type: String, required: true },
  role:           { type: String, enum: ['donor','receiver','admin'], default: 'receiver' },
  phone:          { type: String },
  city:           { type: String },
  bloodGroup:     { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'] },
  available:      { type: Boolean, default: true },
  healthNote:     { type: String },
  lastDonated:    { type: Date },
  resetOTP:       { type: String },
  resetOTPExpiry: { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);