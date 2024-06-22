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
  .catch((err) => console.error(err));

const Song = require('./models/Song');
const Concert = require('./models/Concert');

// Get all songs or public songs based on query parameter
app.get('/api/song', async (req, res, next) => {
  try {
    const isPublic = req.query.public === 'true';
    const query = isPublic ? { public: true } : {};

    const songs = await Song.find(query)
      .populate('tutorials')
      .exec();

    res.status(200).json(songs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific song
app.get('/api/song/:id', (req, res, next) => {
  Song.findOne({ _id: req.params.id })
    .then(song => res.status(200).json(song))
    .catch(error => res.status(404).json({ error }));
});

// Add a song
app.post('/api/song', async (req, res, next) => {
  try {
    const songCount = await Song.countDocuments();

    delete req.body._id;

    const song = new Song({
      ...req.body,
      order: songCount + 1
    });

    await song.save();
    res.status(201).json({ message: 'New song added!' });

  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edit a song
app.put('/api/song/:id', async (req, res, next) => {
  const { id } = req.params;

  try {
    // Vérification de la validité de l'ID (par exemple, s'il est en hexadécimal)
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid song ID' });
    }

    const updatedSong = await Song.findByIdAndUpdate(
      id,
      { ...req.body, _id: id }, // Met à jour les champs requis
      { new: true } // Retourne le document mis à jour
    );

    if (!updatedSong) {
      return res.status(404).json({ error: 'Song not found' });
    }

    res.status(200).json({ message: 'Song edited!', song: updatedSong });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete a song
app.delete('/api/song/:id', (req, res, next) => {
  Song.deleteOne({ _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
    .catch(error => res.status(400).json({ error }));
});

// Move UP a song
app.put('/api/song/move-up/:id', async (req, res, next) => {
  try {
    const songId = req.params.id;

    const songToMove = await Song.findOne({ _id: songId });
    if (!songToMove) {
      return res.status(404).json({ message: 'Chanson non trouvée' });
    }

    const songAbove = await Song.findOne({ order: songToMove.order - 1 });
    if (!songAbove) {
      return res.status(400).json({ message: 'Impossible de monter davantage' });
    }

    const oldSongToMoveOrder = songToMove.order;
    const oldSongAboveOrder = songAbove.order;

    songAbove.order = -1;
    await songAbove.save();
  
    songToMove.order = oldSongAboveOrder;
    await songToMove.save();
  
    songAbove.order = oldSongToMoveOrder;
    await songAbove.save();

    res.status(200).json({ message: 'Chanson déplacée vers le haut avec succès' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Move DOWN a song
app.put('/api/song/move-down/:id', async (req, res, next) => {
  try {
    const songId = req.params.id;

    const songToMove = await Song.findOne({ _id: songId });
    if (!songToMove) {
      return res.status(404).json({ message: 'Chanson non trouvée' });
    }

    const songBelow = await Song.findOne({ order: songToMove.order + 1 });
    if (!songBelow) {
      return res.status(400).json({ message: 'Impossible de descendre davantage' });
    }

    const oldSongToMoveOrder = songToMove.order;
    const oldSongBelowOrder = songBelow.order;

    songBelow.order = -1;
    await songBelow.save();
  
    songToMove.order = oldSongBelowOrder;
    await songToMove.save();
  
    songBelow.order = oldSongToMoveOrder;
    await songBelow.save();

    res.status(200).json({ message: 'Chanson déplacée vers le bas avec succès' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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
      $set: {
        'tutorials.$.type': req.body.type,
        'tutorials.$.title': req.body.title,
        'tutorials.$.googleId': req.body.googleId,
        'tutorials.$.lyrics': req.body.lyrics,
        'tutorials.$.categories': req.body.categories,
        'tutorials.$.gender': req.body.gender,
      },
    };

    const result = await Song.updateOne(
      { _id: songId, 'tutorials._id': tutorialId },
      updateFields
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

// Move UP a tutorial
app.put('/api/song/:id/move-up/:tutorialId', async (req, res, next) => {
  try {
    const songId = req.params.id;
    const tutorialId = req.params.tutorialId;

    const song = await Song.findOne({ _id: songId });

    if (!song) {
      return res.status(404).json({ message: 'Chanson non trouvée' });
    }

    const tutorialIndex = song.tutorials.findIndex(tutorial => tutorial._id == tutorialId);

    if (tutorialIndex === -1) {
      return res.status(404).json({ message: 'Tutoriel non trouvé' });
    }

    if (tutorialIndex > 0) {
      // Swap the positions of the current tutorial and the one above it
      const temp = song.tutorials[tutorialIndex];
      song.tutorials[tutorialIndex] = song.tutorials[tutorialIndex - 1];
      song.tutorials[tutorialIndex - 1] = temp;

      await song.save();
      res.status(200).json({ message: 'Tutoriel déplacé vers le haut avec succès' });
    } else {
      res.status(400).json({ message: 'Impossible de monter davantage' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Move DOWN a tutorial
app.put('/api/song/:id/move-down/:tutorialId', async (req, res, next) => {
  try {
    const songId = req.params.id;
    const tutorialId = req.params.tutorialId;

    const song = await Song.findOne({ _id: songId });

    if (!song) {
      return res.status(404).json({ message: 'Chanson non trouvée' });
    }

    const tutorialIndex = song.tutorials.findIndex(tutorial => tutorial._id == tutorialId);

    if (tutorialIndex === -1) {
      return res.status(404).json({ message: 'Tutoriel non trouvé' });
    }

    if (tutorialIndex < song.tutorials.length - 1) {
      // Swap the positions of the current tutorial and the one below it
      const temp = song.tutorials[tutorialIndex];
      song.tutorials[tutorialIndex] = song.tutorials[tutorialIndex + 1];
      song.tutorials[tutorialIndex + 1] = temp;

      await song.save();
      res.status(200).json({ message: 'Tutoriel déplacé vers le bas avec succès' });
    } else {
      res.status(400).json({ message: 'Impossible de descendre davantage' });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/*
* CONCERTS
*/

// Get all concerts
app.get('/api/concert', async (req, res, next) => {
  try {
    const concerts = await Concert.find({}, 'name slug').exec();
    res.status(200).json(concerts);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific concert by ID
app.get('/api/concert/:id', async(req, res, next) => {
  try {
    const { idConcert } = req.params;

    if (!mongoose.Types.ObjectId.isValid(idConcert)) {
      return res.status(400).json({ error: 'Invalid concert ID' });
    }

    const concert = await Concert.findById(idConcert);
    if (!concert) {
      return res.status(404).json({ error: 'Concert not found' });
    }
  
    const songs = await Song.find({ concerts: idConcert })
      .populate('tutorials')
      .exec();
  
    res.status(200).json(songs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get a specific concert by slug
app.get('/api/concert/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
  
    const concert = await Concert.findOne({ slug })
      .populate('songs')
      .exec();
    
    if (!concert) {
      return res.status(404).json({ error: 'Concert not found' });
    }

    res.status(200).json(concert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a concert
app.post('/api/concert', async (req, res, next) => {
  try {
    const { name, slug, date, songs } = req.body;

    if (!name || !slug ) {
      return res.status(400).json({ error: 'Name and slug are required' });
    }

    const concert = new Concert({
      name,
      slug,
      date,
      songs
    });

    await concert.save();

    res.status(201).json({ message: 'New concert added!', concert });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Edit a concert
app.put('/api/concert/:id', async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid concert ID' });
  }

  const { name, slug, date, songs } = req.body;

  if (!name || !slug) {
    return res.status(400).json({ error: 'Name and slug are required' });
  }

  try {
    const updatedConcert = await Concert.findByIdAndUpdate(
      id,
      { name, slug, date, songs },
      { new: true } // Pour renvoyer le concert mis à jour plutôt que l'ancien
    );

    if (!updatedConcert) {
      return res.status(404).json({ error: 'Concert not found' });
    }

    res.status(200).json({ message: 'Concert updated successfully', concert: updatedConcert });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



module.exports = app;