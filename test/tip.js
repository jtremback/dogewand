'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var async = require('async');
var utility = require('./utility');


// Connect to mongodb
(function () {
  var options = { server: { socketOptions: { keepAlive: 1 } }, auto_reconnect: true };
  mongoose.connect(config.db, options);
})();


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

test('reset', function (t) {
  async.series([
    async.apply(utility.resetMongo, Tip, Account),
    async.apply(utility.fakeAccounts, Account),
    utility.resetBalances
  ], function (err, results) {
    t.notOk(err);
    wallet_a = results[1][0]._id.toString();
    wallet_b = results[1][1]._id.toString();
    seedFunds();
  });

  function seedFunds () {
    rpc({
      method: 'move', // Move some funds to test with
      params: ['', wallet_a, 6]
    }, function (err) {
      t.notOk(err);
      t.end();
    });
  }
});

// Action
test('create', function (t) {

  var opts = {
    from_wallet: wallet_a,
    to_wallet: wallet_b,
    amount: amount
  };

  rpc({
    method: 'getbalance', // Check balance beforehand
    params: [opts.from_wallet]
  }, function (err, old_balance) {
    Tip.create(opts, function (err, tip) {
      t.notOk(err);
      t.equal(tip.from_wallet, opts.from_wallet, 'mongo from_wallet correct');
      t.equal(tip.to_wallet, opts.to_wallet, 'mongo to_wallet correct');
      t.equal(tip.state, 'created', 'mongo state correct');

      Account.findById(tip.from_wallet, function (err, wallet) {
        t.equal(wallet.balance, old_balance - opts.amount, 'account has been properly debited');
      });

      rpc({
        method: 'listtransactions',
        params: [ opts.from_wallet, 1 ]
      }, function (err, result) {
        result = result[0];
        t.equal(result.amount, -opts.amount, 'dogecoind amount correct');
        t.equal(result.otheraccount, '', 'dogecoind otheraccount correct');
        t.end();
      });
    });
  });
  
});

test('insufficient', function (t) {
  t.plan(1);

  // Check for rejection on insufficient funds
  Tip.create({
    from_wallet: wallet_a,
    to_wallet: wallet_b,
    amount: Infinity // So awesome to finally use this. No tip can be this large!
  }, function (err) {
    t.equal(err, 'insufficient', 'err insufficient');
  });
});

test('cancel', function (t) {
  t.plan(6);
  
  var opts = {
    from_wallet: wallet_a,
    to_wallet: wallet_b,
    amount: amount
  };

  Tip.create(opts, function (err, tip) {
    rpc({
      method: 'getbalance',
      params: [opts.from_wallet]
    }, function (err, old_balance) {
      tip.resolve('cancel', function (err, tip) {
        t.equal(tip.state, 'canceled', 'mongo state correct');

        rpc({
          method: 'listtransactions',
          params: [ '', 1 ]
        }, function (err, result) {
          t.notOk(err);
          result = result[0];
          t.equal(result.amount, -opts.amount, 'dogecoind amount correct');
          t.equal(result.otheraccount, opts.from_wallet, 'dogecoind otheraccount correct');
          t.equal(result.comment, tip.resolved_id, 'resolved_id correct');

          Account.findById(tip.from_wallet, function (err, wallet) {
            t.equal(wallet.balance, old_balance + opts.amount);
          });
        });
      });
    });
  });
});

test('claim', function (t) {
  t.plan(6);
  
  var opts = {
    from_wallet: wallet_a,
    to_wallet: wallet_b,
    amount: amount
  };

  Tip.create(opts, function (err, tip) {
    rpc({
      method: 'getbalance',
      params: [opts.to_wallet]
    }, function (err, old_balance) {
      tip.resolve('claim', function (err, tip) {
        t.equal(tip.state, 'claimed', 'mongo state correct');

        rpc({
          method: 'listtransactions',
          params: [ '', 1 ]
        }, function (err, result) {
          t.notOk(err);
          result = result[0];
          t.equal(result.amount, -opts.amount, 'dogecoind amount correct');
          t.equal(result.otheraccount, opts.to_wallet, 'dogecoind otheraccount correct');
          t.equal(result.comment, tip.resolved_id, 'resolved_id correct');

          Account.findById(tip.to_wallet, function (err, wallet) {
            t.equal(wallet.balance, (old_balance + opts.amount), 'balance added to receiving account');
          });
        });
      });
    });
  });
});

test('end', function (t) {
  Tip.find({}).remove(function (err) {
    t.notOk(err);
    Account.find({}).remove(function (err) {
      t.notOk(err);
      t.end();
      process.exit();
    });
  });
});
