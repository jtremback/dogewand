'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var utility = require('../test-utility');
require('../app/models/account.js');
require('../app/models/tip.js');
var logic = require('../app/controllers/logic.js');

function getBalances(_ids, callback) {
  async.map(_ids, iterator, callback);

  function iterator (_id, cb) {
    rpc({
      method: 'getbalance',
      params: [_id]
    }, cb);
  }
}

test('---------------------------------------- logic.js', function (t) {
  // Connect to mongodb
  mongoose.connect(config.db, {
    auto_reconnect: true,
    server: {
      socketOptions: {
        keepAlive: 1
      }
    }
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

    utility.init(Tip, Account, accounts, function (err, wallet_a1, wallet_b1) {
      wallet_a = wallet_a1;
      wallet_b = wallet_b1;
      t.end();
    });
  });





  t.test('createTip to existing account', function (t) {
    var opts = {
      username: wallet_b.username,
      provider: wallet_b.provider,
      amount: amount
    };

    logic.createTip(wallet_a, opts, function (err) {
      t.error(err, 'createTip');

      setTimeout(function () {
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
      }, 2000);
    });
  });

  t.test('createTip to nonexistant account', function (t) {
    var opts = {
      username: 'Chewbacca',
      provider: 'farcebook',
      amount: amount
    };

    logic.createTip(wallet_a, opts, function (err) {
      t.error(err, 'createTip');

      setTimeout(function () {
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
      }, 2000);
    });
  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});