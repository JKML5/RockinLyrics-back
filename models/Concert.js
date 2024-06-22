const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const concertSchema = new Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  date: { type: Date },
  songs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }] 
});

// Index unique pour le champ "slug"
concertSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Concert', concertSchema);