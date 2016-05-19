'use strict';

const Promise = require('bluebird');
const fs = require('fs');
const mm = require('musicmetadata');

/*
Omri & Zeke:
  We needed to write a wrapper around `musicmetadata` because
  of a bug we discovered in their use of a single reused buffer
  for all of their album art work. album <-> art <-> song  assoc
  was incorrect.
*/

module.exports = function (name) {
  return new Promise(function (resolve, reject) {
    mm(fs.createReadStream(name), function (err, metadata) {
      if (err) return reject(err);

      metadata.path = name;
      metadata.picture = metadata.picture[0] || { data: new Buffer(0), format: 'jpg' };
      // replace data with a copy to prevent caching
      var secondPictureBuffer = new Buffer(metadata.picture.data.length);
      metadata.picture.data.copy(secondPictureBuffer);
      metadata.picture.data = secondPictureBuffer;

      resolve(metadata);
    });
  });
};
