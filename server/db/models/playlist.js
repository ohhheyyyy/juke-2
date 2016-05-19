'use strict';

const db = require('../db');
const addArtistList = require('./plugins/addArtistList');
const DataTypes = db.Sequelize;

module.exports = db.define('playlist', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    set: function (val) {
      this.setDataValue('name', val.trim());
    }
  },
  artists: {
    type: DataTypes.VIRTUAL
  }
}, {
  scopes: {
    populated: () => ({ // function form lets us refer to undefined models
      include: [{
        model: db.model('song'),
        include: [{
          model: db.model('artist'),
        }]
      }]
    })
  },
  instanceMethods: {
    addArtistList: addArtistList,
    addAndReturnSong: function (songId) { // `addSong` doesn't promise a song.
      songId = String(songId);
      const addedToList = this.addSong(songId);
      const songFromDb = db.model('song').findById(songId);
      return DataTypes.Promise.all([addedToList, songFromDb])
      .spread((result, song) => song);
    }
  },
  hooks: { // automatically adds an artist list if we have songs
    afterFind: function (queryResult) {
      if (!queryResult) return;
      if (!Array.isArray(queryResult)) queryResult = [queryResult];
      queryResult.forEach(item => item.addArtistList());
    }
  }
});
