'use strict';

const _ = require('lodash');

// for an entity with .songs, puts all unique artists on entity.artists

module.exports = function () {
  if (!this.songs) return;
  const artistsById = {};
  this.songs.forEach(song => {
    song.artists.forEach(artist => {
      artistsById[artist.id] = artist;
    });
  });
  this.artists = _.values(artistsById);
};
