'use strict';

const express = require('express');
const router = express.Router();
const mime = require('mime');
const chalk = require('chalk');
const sendSeekable = require('./middleware/sendSeekable');
const models = require('../../db/models');
const Song = models.Song;

module.exports = router;

router.get('/', function (req, res, next) {
  Song.findAll({ where: req.query })
  .then(songs => res.json(songs))
  .catch(next);
});

router.param('songId', function (req, res, next, id) {
  Song.findById(id)
  .then(song => {
    if(!song) throw new Error('not found!');
    req.song = song;
    next();
    return null; // silences bluebird warning about promises inside of next
  })
  .catch(next);
});

router.get('/:songId', function (req, res) {
  res.json(req.song);
});

router.get('/:songId/image', function (req, res, next) {
  req.song.getAlbum({
    attributes: ['cover', 'coverType']
  })
  .then(album => {
    if (!album.cover || !album.coverType) throw new Error('no cover');
    res.set('Content-Type', mime.lookup(album.coverType));
    res.send(album.cover);
  })
  .catch(next);
});

/**
 * Special Note:
 *
 * We store song audio directly in the db as `bytea` columns. This means you
 * do not have to manually seed or copy music folders between workshop stages.
 * However, retrieving this data is slow for anything over a couple Mb:
 * the entire bytea column is loaded in memory by the driver (no streaming),
 * and the hex byte array is converted to binary (slow). We mitigate this
 * by (evilly) adding audio to an in-memory cache after first load, so that
 * subsequent requests — replaying a song, or seeking within a song — does not
 * hit the slow db retrieval. That cache is lost on every server restart.
 *
 * In a real app, it would be far better to store the audio as files, and
 * the db songs would have filepaths. Then Express could stream the file
 * contents near-instantly, plus there would be no need for a cache.
 */

const audioCache = {}; // stores entire song buffers; bad idea for production

router.get('/:songId/audio', sendSeekable, function (req, res, next) {
  if(!req.song.extension) return next(new Error('No audio for song'));
  const id = req.params.songId;
  // caching to help overcome PSQL's sllloowwww byte array format
  const cached = audioCache[id];
  if (cached) return res.sendSeekable(cached.buffer, cached.options);
  // first-time lookup is still slow :-(
  console.log(chalk.yellow(`Audio ${id}: fetching for the first time.`));
  const options = {
    type: mime.lookup(req.song.extension),
    length: req.song.size
  };
  Song.findById(id, {
    attributes: ['buffer']
  })
  .then(song => {
    console.log(chalk.blue(`Audio ${id}: fetched; now caching and sending.`));
    audioCache[id] = {
      options: options,
      buffer: song.buffer
    };
    res.sendSeekable(song.buffer, options);
  })
  .catch(next);
});
