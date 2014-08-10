'use strict';

var daemon = require('app/models/daemon.js');

var emitter = daemon(6, 20000);

emitter.on('deposit', log);

emitter.on('error', log);

function log (stuff) {
  console.log('deposit daemon: ', stuff);
}