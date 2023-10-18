const config = require('./config');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

// Fix CORS errors
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// MongoDB connection
mongoose.connect(config.database.connectionString,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

const Song = require('./models/song');

// Get all songs
app.get('/api/song', (req, res, next) => {
  Song.find()
    .populate('tutorials')
    .then(songs => res.status(200).json(songs))
    .catch(error => res.status(400).json({ error }));
});

// Get a specific song
app.get('/api/song/:id', (req, res, next) => {
  Song.findOne({ _id: req.params.id })
    .then(song => res.status(200).json(song))
    .catch(error => res.status(404).json({ error }));
});

module.exports = app;