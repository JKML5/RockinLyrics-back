const mongoose = require('mongoose');
const tutorialSchema = require('./Tutorial');

const songSchema = mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: String, required: true },
  tutorials: [tutorialSchema],
});

// Index unique pour les champs "title" et "artist"
songSchema.index({ title: 1, artist: 1 }, { unique: true });

module.exports = mongoose.model('Song', songSchema);