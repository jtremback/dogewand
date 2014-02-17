'use strict';

var mongoose = require('mongoose');
var config = require('../config/config')();
var fs = require('fs');
var nock = require('nock');

// Bootstrap db connection
// Connect to mongodb
var connect = function () {
  var options = { server: { socketOptions: { keepAlive: 1 } }, auto_reconnect: true };
  mongoose.connect(config.db, options);
};

connect();

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err);
});

// Reconnect when closed
mongoose.connection.on('disconnected', function () {
  connect();
});

// Bootstrap models
var models_path = '../app/models';
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file);
});


var Tip = mongoose.model('Tip');

// var ObjectID = require('mongodb').ObjectID;
// var tx_id = new ObjectID();

// console.log(tx_id);

// console.log(tx_id.getTimestamp());

// nock.recorder.rec();

Tip.create({
  from_wallet: '2is0rnd8hf4y',
  to_wallet: '2is0rnd8hf4z',
  amount: 1
}, function (err, tip, response) {
  console.log('error: ' + err, 'tip: ' + tip, 'response: ' + response);

  
  Tip.findOne({ to_wallet: '2is0rnd8hf4z', state: 'created'}, function (err, tip) {
    if (err) return console.log(err);
    tip.resolve('cancel', function (err, tip, data) {
      // Tip.find({ to_wallet: '2is0rnd8hf4z', state: 'claimed'}, function (err, tips) {
      //   console.log(tips);
      // });
      Tip.find({ to_wallet: '2is0rnd8hf4z', state: 'canceled'}, function (err, tips) {
        console.log(tips);
      });
    });
  });
});

