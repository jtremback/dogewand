/* jshint node: true */
'use strict';

var through = require('through');

function wrap (file, data) {
  return 'module.exports = ' + JSON.stringify(data) + ';';
}

module.exports = function (file) {
  var data = '';

  function write (buf) {
    data += buf;
  }

  function end () {
    this.queue(wrap(file, data));
    this.queue(null);
  }

  if (!/\.wrap\./.test(file)) return through();

  return through(write, end);
};