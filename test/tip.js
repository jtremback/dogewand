'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var async = require('async');
var utility = require('../test-utility');



test('---------------------------------------- tip.js', function (t) {
  // Connect to mongodb
  mongoose.connect(config.db, {
    auto_reconnect: true,
    server: {
      socketOptions: {
        keepAlive: 1
      }
    }
  });

  require('../app/models/account.js');
  require('../app/models/tip.js');

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

    utility.init(Tip, Account, accounts, function (err, wallet_a1, wallet_b1) {
      wallet_a = wallet_a1;
      wallet_b = wallet_b1;
      t.end();
    });
  });




  // Action
  t.test('create', function (t) {
    var tip_id = mongoose.Types.ObjectId();

    rpc({
      method: 'getbalance', // Check balance beforehand
      params: [ wallet_a._id ]
    }, function (err, old_balance) {
      Tip.create(wallet_a, wallet_b, amount, tip_id, function (err, tip) {
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
    var tip_id = mongoose.Types.ObjectId();
    // Check for rejection on insufficient funds
    Tip.create(wallet_a, wallet_b, Infinity, tip_id, function (err) {
      t.equal(err, 402, 'err insufficient');
      t.end();
    });
  });

  t.test('claim', function (t) {
    var tip_id = mongoose.Types.ObjectId();

    Tip.create(wallet_a, wallet_b, amount, tip_id, function (err, tip) {
      rpc({
        method: 'getbalance', // Check balance beforehand
        params: [wallet_a._id]
      }, function (err, old_balance) {
        Tip.resolve(tip._id, wallet_a, function (err, tip, user) {
          t.error(err);
          t.equal(tip.recipient_id.toString(), wallet_a._id.toString(), 'tip.recipient_id correct');
          t.deepEqual(wallet_a, user, 'user correct');
          t.equal(user.balance, old_balance + amount, 'user balance correct');
          t.end();
        });
      });
    });
  });

  t.test('cancel', function (t) {
    var tip_id = mongoose.Types.ObjectId();

    Tip.create(wallet_a, wallet_b, amount, tip_id, function (err, tip) {
      rpc({
        method: 'getbalance', // Check balance beforehand
        params: [wallet_b._id]
      }, function (err, old_balance) {
        Tip.resolve(tip._id, wallet_b, function (err, tip, user) {
          t.error(err);
          t.equal(wallet_b._id.toString(), tip.recipient_id.toString(), 'tip.recipient_id correct');
          t.deepEqual(wallet_b, user, 'user correct');
          t.equal(user.balance, old_balance + amount, 'user balance correct');
          t.end();
        });
      });
    });
  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
      process.exit();
    });
  });
});


