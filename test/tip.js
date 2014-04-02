'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var async = require('async');
var utility = require('../test-utility');



test('- Tip model', function (t) {
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

  var amount = 1;
  var wallet_a;
  var wallet_b;

  t.test('reset', function (t) {
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
        t.notOk(err, 'move');
        t.end();
      });
    }
  });

  // Action
  t.test('create', function (t) {

    rpc({
      method: 'getbalance', // Check balance beforehand
      params: [ wallet_a._id ]
    }, function (err, old_balance) {
      Tip.create(wallet_a, wallet_b, amount, function (err, tip) {
        t.error(err, 'Tip.create');
        t.equal(tip.tipper_id, wallet_a._id, 'mongo tipper correct');
        t.equal(tip.tippee_id, wallet_b._id, 'mongo tippee_id correct');
        t.equal(tip.state, 'created', 'mongo state correct');

        Account.findById(tip.tipper_id, function (err, account) {
          t.error(err);
          t.equal(account.balance, old_balance - amount, 'account has been properly debited');
        });

        rpc({
          method: 'listtransactions',
          params: [ wallet_a._id, 1 ]
        }, function (err, result) {
          t.error(err);
          result = result[0];
          t.equal(result.amount, -amount, 'dogecoind amount correct');
          t.equal(result.otheraccount, '', 'dogecoind otheraccount correct');
          t.end();
        });
      });
    });

  });

  t.test('insufficient', function (t) {
    // Check for rejection on insufficient funds
    Tip.create(wallet_a, wallet_b, Infinity, function (err) {
      t.equal(err, 402, 'err insufficient');
      t.end();
    });
  });

  t.test('claim', function (t) {
    Tip.create(wallet_a, wallet_b, amount, function (err, tip) {
      rpc({
        method: 'getbalance', // Check balance beforehand
        params: [wallet_a._id]
      }, function (err, old_balance) {
        Tip.resolve(tip._id, wallet_a, function (err, tip, user) {
          t.error(err);
          t.equal(tip.recipient_id, wallet_a._id, 'tip.recipient_id correct');
          t.deepEqual(wallet_a, user, 'user correct');
          t.equal(user.balance, old_balance + amount, 'user balance correct');
          t.end();
        });
      });
    });
  });

  t.test('cancel', function (t) {
    Tip.create(wallet_a, wallet_b, amount, function (err, tip) {
      rpc({
        method: 'getbalance', // Check balance beforehand
        params: [wallet_b._id]
      }, function (err, old_balance) {
        Tip.resolve(tip._id, wallet_b, function (err, tip, recipient) {
          t.error(err);
          t.equal(wallet_b._id, tip.recipient_id, 'recipient_id correct');
          t.deepEqual(wallet_b, recipient, 'recipient correct');
          t.equal(recipient.balance, old_balance + amount, 'recipient balance correct');
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


