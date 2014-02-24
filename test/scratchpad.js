'use strict';

var mongoose = require('mongoose');
var config = require('../config/config')();
var rpc = require('../app/rpc')(config.rpc);
var fs = require('fs');


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
var Account = mongoose.model('Account');

// var ObjectID = require('mongodb').ObjectID;
// var tx_id = new ObjectID();

// console.log(tx_id);

// console.log(tx_id.getTimestamp());

// nock.recorder.rec();

// ObjectId("53094bd705f76eaac594158b")

// Tip.create({
//   from_wallet: '53094bd705f76eaac594158b',
//   to_wallet: '530979c7fabedd830a383f56',
//   amount: 1
// }, function (err, tip) {
//   if (err) return console.log('error: ' + JSON.stringify(err), 'tip: ' + tip);

  
//   Tip.findOne({ to_wallet: '530979c7fabedd830a383f56', state: 'created'}, function (err, tip) {
//     if (err) return console.log(err);
//     tip.resolve('claim', function (err, tip) {
//       console.log(err, tip);
//       Tip.find({ to_wallet: '530979c7fabedd830a383f56', state: 'claimed'}, function (err, tips) {
//         console.log(tips);
//       });
//       // Tip.find({ to_wallet: '530979c7fabedd830a383f56', state: 'canceled'}, function (err, tips) {
//       //   console.log(tips);
//       // });
//     });
//   });
// });

rpc({
  method: 'listtransactions',
  params: [ '', 100]
}, function (err, response) {
  console.log(err, JSON.stringify(response));
});


// rpc({
//   method: 'listtransactions',
//   params: [ '', 100],
//   id: '' // Create id from _id 
// }, function (response) {
//   console.log(JSON.stringify(response));
// });

// Tip.find({ to_wallet: '530979c7fabedd830a383f56', state: 'created' }, function (err, tips) {
//   console.log(tips);
// });

// Account.upsert({provider: 'Farcebook', username: 'Jehoon'}, function (err, account) {
//   account.newAddress(function (result) {
//     console.log(result);
//   });
// });