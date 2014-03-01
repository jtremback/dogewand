'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var fs = require('fs');
var path = require('path');
var utility = require('./utility');
var t_config = utility.config;

// Connect to mongodb
(function () {
  var options = { server: { socketOptions: { keepAlive: 1 } }, auto_reconnect: true };
  mongoose.connect(config.db, options);
})();


// Bootstrap models
var models_path = path.resolve(__dirname, '../app/models');
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file);
});

var Tip = mongoose.model('Tip');
var Account = mongoose.model('Account');

var amount = 1;
var wallet_a;
var wallet_b;


test('reset', function (t) {
  var opts = [{
    username: 'Jehoon',
    provider: 'farcebook'
  }, {
    username: 'C3P0',
    provider: 'farcebook'
  }, {
    username: 'Jehoon', // 2 accounts with same opts- test upserting
    provider: 'farcebook'
  }];

  async.series([
    async.apply(utility.resetMongo, Tip, Account),
    async.apply(utility.fakeAccounts, Account, opts),
    utility.resetBalances
  ], function (err, results) {
    t.notOk(err);

    wallet_a = results[1][0]._id.toString(); // Save for later
    wallet_b = results[1][1]._id.toString();

    t.notEqual(wallet_a, results[1][2]._id.toString()); // Make sure we are really upserting
    t.end();
  });
});


test('update balance', function (t) {
  rpc({
    method: 'move', // Move some funds to test with
    params: ['', wallet_a, 6]
  }, function (err) {
    t.notOk(err);
  });

  Account.updateBalance({ _id: wallet_a }, function (err, account) {
    t.equal(6, account.balance);
    t.end();
  });
});

test('send and recieve', function (t) {
  
    Account.findOne({ _id: wallet_a }, function (err, account) {
      account.newAddress(function (err, address) {

      });
    });

  async.compose( , , Account.findOne)
});


test('end', function (t) {
  t.end();
  process.exit();
});