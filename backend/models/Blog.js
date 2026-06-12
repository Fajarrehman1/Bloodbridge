const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true },
  excerpt:  { type: String, required: true },
  category: {
    type: String,
    enum: ['Awareness','Health Tips','Education','Nutrition'],
    default: 'Awareness'
  },
  author:    { type: String, default: 'BloodBridge Team' },
  image:     { type: String, default: '' },
  published: { type: Boolean, default: true },
  postedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);