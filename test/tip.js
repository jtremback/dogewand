'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var config = require('../config/config')();
var rpc = require('../app/rpc')(config.rpc);
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');


// Connect to mongodb
(function () {
  var options = { server: { socketOptions: { keepAlive: 1 } }, auto_reconnect: true };
  mongoose.connect(config.db, options);
})();


// Bootstrap models
var models_path = '../app/models';
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file);
});

var Tip = mongoose.model('Tip');
var Account = mongoose.model('Account');


// Action
test('create', function (t) {
  t.plan(5);

  var from_wallet = '53094bd705f76eaac594158b'; // Start from the same funded wallet
  var to_wallet = new ObjectID();
  var amount = 0.0001;

  Tip.create({
    from_wallet: from_wallet,
    to_wallet: to_wallet,
    amount: amount // Don't wanna run out
  }, function (err, tip) {

    t.equal(tip.from_wallet, from_wallet, 'mongo from_wallet correct');
    t.equal(tip.to_wallet, to_wallet, 'mongo to_wallet correct');
    t.equal(tip.state, 'created', 'mongo state correct');

    rpc({
      method: 'listtransactions',
      params: [ from_wallet, 1 ]
    }, function (err, response) {
      console.log(response);
      var result = response.result[0];
      t.equal(result.amount, -amount, 'dogecoind amount correct');
      t.equal(result.otheraccount, '', 'dogecoind otheraccount correct');
    });

  });
});
