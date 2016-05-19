'use strict';

// arguments
const dir = process.argv[2];
if (!dir) {
  console.error('Please provide the path to your music folder.');
  process.exit();
}
// built-in modules
const pathLib = require('path');
// installed modules
const _ = require('lodash');
const Promise = require('bluebird');
const fs = require('fs-extra');
const chalk = require('chalk');
// custom modules
const helper = require('./helper');
const metadata = require('./metadataWrapper');
const db = require('../server/db/db');
const models = require('../server/db/models');

Promise.promisifyAll(fs);

const extractMetaData = function (path) {
  return helper.dirWalk(path)
    .then(filesNames => filesNames.filter(helper.isMp3))
    .map(name => metadata(name));
};

function formatSize (bytes) {
  return Math.round(bytes/1000)/1000 + ' MB';
}

Promise.resolve(db.drop({ cascade: true })) // clear the database
.bind({ docsToSave: {} })
.then(function () { // get song metadata and sync db at same time
  console.log('reading file metadata and emptying database');
  return Promise.join(extractMetaData(dir), db.sync({ force: true }));
})
.spread(function (metaData) { // create the artists
  console.log('creating unique artists by name');
  this.analyzedFiles = metaData;
  let artists = _(this.analyzedFiles)
    .pluck('artist')
    .flatten()
    .uniq()
    .value();
  return Promise.map(artists, function (artist) {
    return models.Artist.findOrCreate({ where: { name: artist } })
    .then(artists => artists[0]);
  });
})
.then(function (artists) { // create the albums
  console.log('creating albums by name');
  this.artists = _.indexBy(artists, instance => instance.dataValues.name);
  let albums = _(this.analyzedFiles)
    .pluck('album')
    .uniq()
    .value();
  return Promise.map(albums, function (album) {
    return models.Album.findOrCreate({ where: { name: album } })
    .then(albums => albums[0]);
  });
})
.then(function (albums) {
  this.albums = _.indexBy(albums, instance => instance.dataValues.name);
})
.then(function () { // create the songs
  console.log('creating songs and reading in files');
  this.totalSize = 0;
  let savedCount = 0;
  let limit = this.analyzedFiles.length;
  let allSongsProcessed = this.analyzedFiles.map(function (file) {
    // create initial un-persisted song instance
    file.song = models.Song.build({
      name: file.title,
      genres: file.genre,
      extension: pathLib.extname(file.path),
    });
    // determine foreign keys
    let artistIds = file.artist.map(artist => this.artists[artist].dataValues.id);
    let albumId = this.albums[file.album].dataValues.id;
    // save binary data into song
    return fs.readFileAsync(file.path)
    .then(buffer => {
      console.log(chalk.grey('read: ' + file.song.name));
      this.totalSize += buffer.length;
      file.song.buffer = buffer;
      file.song.size = buffer.length;
      return file.song.save();
    })
    .then(song => {
      savedCount++;
      file.song = song;
      console.log(chalk.green('✓') + chalk.grey(` saved: ${song.name} — ${formatSize(song.size)} (${savedCount}/${limit})`));
      // write to the song-artist & song-album join tables
      let madeArtistAssociations = song.addArtists(artistIds);
      let madeAlbumAssociation = song.setAlbum(albumId);
      return Promise.all([madeArtistAssociations, madeAlbumAssociation]);
    });
  }, this);
  return Promise.all(allSongsProcessed);
})
.then(function () {
  console.log('seeded ' + this.analyzedFiles.length + ' songs (' + formatSize(this.totalSize) + ')');
  console.log('adding covers to albums based on song data');
  this.analyzedFiles.forEach(file => {
    var album = this.albums[file.album];
    if (file.picture && file.picture.data) {
      album.cover = file.picture.data;
      album.coverType = file.picture.format;
    }
  });
  // save albums
  let albums = _(this.albums)
    .values()
    .invoke('save')
    .value();
  return Promise.all(albums);
})
.then(function () {
  console.log(chalk.green('seeding complete!'));
  process.exit(0);
})
.catch(function (err) {
  console.error(chalk.red(err));
  console.error(err.stack);
  process.exit(1);
});
