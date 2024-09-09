const mongoose = require('mongoose');
const { Schema } = mongoose;

const tutorialSchema = new Schema({
  type: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  lyrics: { type: String },
  categories: [{ type: String }],
  gender: { type: String, enum: ['M', 'F', ''], },
});

tutorialSchema.index({ title: 1 }, { unique: true });

module.exports = tutorialSchema;