'use strict';

const db = require('../db');
const addArtistList = require('./plugins/addArtistList');
const DataTypes = db.Sequelize;

module.exports = db.define('album', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    set: function (val) {
      this.setDataValue('name', val.trim());
    }
  },
  cover: {
    type: DataTypes.BLOB
  },
  coverType: {
    type: DataTypes.STRING
  },
  artists: {
    type: DataTypes.VIRTUAL
  }
}, {
  defaultScope: {
    attributes: { exclude: ['cover', 'coverType'] }
  },
  scopes: {
    populated: () => ({ // function form lets us use to-be-defined models
      include: [{
        model: db.model('song') // populated with artists due to song model
      }]
    })
  },
  instanceMethods: {
    addArtistList: addArtistList
  },
  hooks: { // automatically adds an artist list if we have songs
    afterFind: function (queryResult) {
      if (!queryResult) return;
      if (!Array.isArray(queryResult)) queryResult = [queryResult];
      queryResult.forEach(item => item.addArtistList());
    }
  }
});
