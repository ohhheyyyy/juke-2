'use strict';

const db = require('../db');
const DataTypes = db.Sequelize;

module.exports = db.define('song', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    set: function (val) {
      this.setDataValue('name', val.trim());
    }
  },
  genres: {
    type: DataTypes.ARRAY(DataTypes.STRING)
  },
  extension: {
    type: DataTypes.STRING,
    allowNull: false
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  buffer: {
    type: DataTypes.BLOB, // sequelize alias, but in postgres actually `bytea`
    allowNull: false
  }
}, {
  defaultScope: {
    attributes: {
      include: ['albumId'], // excluded by default, need for `song.getAlbum()`
      exclude: ['buffer']
    },
    include: [{
      // defaultScope can't be func, so song must come after artist definition
      model: db.model('artist')
    }]
  }
});
