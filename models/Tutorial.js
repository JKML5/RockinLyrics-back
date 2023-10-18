const mongoose = require('mongoose');

const tutorialSchema = mongoose.Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  googleId: { type: String, required: true },
  lyrics: { type: String },
  categories: [{ type: String }],
  gender: { type: String, enum: ['M', 'F'] },
});

tutorialSchema.index({ title: 1 }, { unique: true });
tutorialSchema.index({ googleId: 1 }, { unique: true });

module.exports = tutorialSchema;