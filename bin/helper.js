'use strict';

const Promise = require('bluebird');
const crypto = require('crypto');
const pathLib = require('path');
const fs = require('fs');

Promise.promisifyAll(fs);

module.exports = {

  getSha1: function (val) {
    let shaSum = crypto.createHash('sha1');
    shaSum.update(val);
    return shaSum.digest('hex');
  },

  isMp3: (path) => ['.mp3', '.m4a', '.mp4'].includes(pathLib.extname(path)),

  dirWalk: function dirWalk (all, root) {
    if (!root) {
      root = all;
      all = [];
    }
    function add (elem) {
      all.push(elem);
      return all;
    }
    function fullPath (filepath) {
      return root + '/' + filepath;
    }
    return fs.statAsync(root)
    .then(function (stats) {
      if (stats.isDirectory()) {
        return fs.readdirAsync(root)
        .map(fullPath)
        .reduce(dirWalk, all);
      } else if (stats.isFile()) {
        return add(root);
      }
    });
  }

};
