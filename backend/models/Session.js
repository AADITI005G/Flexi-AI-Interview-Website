const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    topic: { type: String, required: true },
    question: { type: String, required: true },
    answer: { type: String },
    feedback: { type: String },
    score: { type: Number, min: 1, max: 5 },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Session || mongoose.model('Session', sessionSchema);