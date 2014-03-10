'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var utility = require('../test-utility');

// var app = require('../');


test('API controller', function (t) {
  // Connect to mongodb
  mongoose.connect(config.db, {
    auto_reconnect: true,
    server: {
      socketOptions: {
        keepAlive: 1
      }
    }
  });

  // Bootstrap models
  var fs = require('fs');
  var path = require('path');
  var models_path = path.resolve(__dirname, '../app/models');
  fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js')) require(models_path + '/' + file);
  });

  var Tip = mongoose.model('Tip');
  var Account = mongoose.model('Account');

  // Needs to be required under models
  var api = require('../app/controllers/api.js');

  var amount = 1;
  var wallet_a;
  var wallet_b;

  t.test('setup', function (t) {
    var accounts = [{
      username: 'Jehoon',
      provider: 'farcebook'
    }, {
      username: 'C3P0',
      provider: 'farcebook'
    }];

    async.series([
      async.apply(utility.resetMongo, [ Tip, Account ]),
      async.apply(utility.fakeAccounts, Account, accounts),
      utility.resetBalances
    ], function (err, results) {
      t.error(err);
      wallet_a = results[1][0];
      wallet_b = results[1][1];
      seedFunds();
    });

    function seedFunds () {
      rpc({
        method: 'move', // Move some funds to test with
        params: ['', wallet_a._id, 6]
      }, function (err) {
        t.error(err);
        t.end();
      });
    }
  });

  t.test('createTip', function (t) {
    api.createTipTest(wallet_a, {
      username: wallet_b.username,
      provider: wallet_b.provider,
      amount: amount
    }, function (err, tip) {
      t.error(err, 'createTip');
      t.end();
    });
  });

  t.test('claim', function (t) {
    Tip.create(wallet_a, wallet_b, amount, function (err, tip) {
      rpc({
        method: 'getbalance', // Check balance beforehand
        params: [wallet_b._id]
      }, function (err, old_balance) {
        api.resolveTipTest(wallet_b, tip._id, function (err, response) {
          t.error(err, 'resolveTipTest');
          t.equal(wallet_b._id, response.tip.recipient_id, 'tip.recipient_id correct');
          t.deepEqual(wallet_b, response.recipient, 'recipient correct');
          t.equal(response.recipient.balance, old_balance + amount, 'recipient balance correct');
          t.end();
        });
      });
    });
  });

  t.test('cancel', function (t) {
    Tip.create(wallet_a, wallet_b, amount, function (err, tip) {
      rpc({
        method: 'getbalance', // Check balance beforehand
        params: [wallet_a._id]
      }, function (err, old_balance) {
        api.resolveTipTest(wallet_a, tip._id, function (err, response) {
          t.error(err, 'resolveTipTest');
          t.equal(wallet_a._id, response.tip.recipient_id, 'tip.recipient_id correct');
          t.deepEqual(wallet_a, response.recipient, 'recipient correct');
          t.equal(response.recipient.balance, old_balance + amount, 'recipient balance correct');
          t.end();
        });
      });
    });
  });
  
  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});