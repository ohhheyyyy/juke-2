'use strict';

const express = require('express');
const mime = require('mime');
const router = express.Router();
const models = require('../../db/models');
const Album = models.Album;
module.exports = router;

router.get('/', function (req, res, next) {
  Album.scope('defaultScope', 'populated').findAll({ where: req.query })
  .then(albums => res.json(albums))
  .catch(next);
});

router.param('albumId', function (req, res, next, id) {
  Album.scope('defaultScope', 'populated').findById(id)
  .then(function (album) {
    if (!album) throw new Error('not found!');
    req.album = album;
    next();
    return null; // silences bluebird warning about promises inside of next
  })
  .catch(next);
});

router.get('/:albumId', function (req, res) {
  res.json(req.album);
});

router.get('/:albumId/image', function (req, res, next) {
  Album.findById(req.params.albumId, {
    attributes: ['cover', 'coverType']
  })
  .then(function (album) {
    if (!album.cover || !album.coverType) return next(new Error('no cover'));
    res.set('Content-Type', mime.lookup(album.coverType));
    res.send(album.cover);
  })
  .catch(next);
});

router.get('/:albumId/songs/', function (req, res) {
  res.json(req.album.songs);
});

router.get('/:albumId/songs/:songId', function (req, res) {
  const songToSend = req.album.songs.find(song => {
    return song.id === Number(req.params.songId);
  });
  if (!songToSend) return res.sendStatus(404);
  res.json(songToSend);
});
