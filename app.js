const config = require('./config');
const express = require('express');
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

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

// Add a song
app.post('/api/song', (req, res, next) => {
  delete req.body._id;
  const song = new Song({
    ...req.body
  });
  song.save()
    .then(() => res.status(201).json({ message: 'New song added!'}))
    .catch(error => res.status(400).json({ error }));
});

// Edit a song
app.put('/api/song/:id', (req, res, next) => {
  Song.updateOne({ _id: req.params.id }, { ...req.body, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Song edited !'}))
    .catch(error => res.status(400).json({ error }));
});

// Delete a song
app.delete('/api/song/:id', (req, res, next) => {
  Song.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
    .catch(error => res.status(400).json({ error }));
});

// Add a tutorial to a song
app.post('/api/song/:id', (req, res, next) => {
  delete req.body._id;

  Song.findOne({ _id: req.params.id })
    .then((song) => {
      if (!song) {
        return res.status(404).json({ message: 'Chanson non trouvée' });
      }

      song.tutorials.push(req.body);

      return song.save()
        .then(() => res.status(201).json({ message: 'Tutoriel ajouté à la chanson avec succès', status: 201 }));
    })
    .catch(error => res.status(400).json({ error }));
});

// Edit a tutorial in a song
app.put('/api/song/:id/:tutorialId', async (req, res, next) => {
  try {
    const songId = req.params.id;
    const tutorialId = req.params.tutorialId;

    const updateFields = {
      'tutorials.$': {
        type: req.body.type,
        title: req.body.title,
        googleId: req.body.googleId,
        lyrics: req.body.lyrics,
        categories: req.body.categories,
        gender: req.body.gender,
      },
    };

    const result = await Song.updateOne(
      { _id: songId, 'tutorials._id': tutorialId },
      { $set: updateFields }
    );

    if (result.modifiedCount > 0) {
      res.status(200).json({ message: 'Tutoriel modifié !' });
    } else {
      res.status(404).json({ message: 'Tutoriel non trouvé ou aucune modification effectuée.' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Remove a tutorial from a song
app.delete('/api/song/:id/:tutorialId', async (req, res, next) => {
  try {
    const songId = req.params.id;
    const tutorialId = req.params.tutorialId;

    const result = await Song.updateOne(
      { _id: songId },
      { $pull: { tutorials: { _id: tutorialId } } }
    );

    res.status(200).json({ message: 'Tutoriel supprimé avec succès.' });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = app;