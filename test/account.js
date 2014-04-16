'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var utility = require('../test-utility');


test('---------------------------------------- account.js', function (t) {
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





  t.test('findCall and updateBalance', function (t) {
    utility.resetBalances(function () {
      rpc({
        method: 'move', // Move some funds to test with
        params: ['', wallet_a._id, 6]
      }, function (err) {
        t.error(err);
        Account.findCall('updateBalance', { _id: wallet_a }, function (err, account) {
          t.equal(6, account.balance);
          t.end();
        });
      });
    });
  });


  t.test('send and recieve', function (t) {

    function findOne (conditions, callback) {
      Account.findOne(conditions, function (err, account) {
        var results = { account: account };
        callback(err, results);
      });
    }

    function newAddress (results, callback) {
      results.account.newAddress(function (err, address) {
        results.address = address;
        callback(err, results);
      });
    }

    function withdraw (results, callback) {
      results.account.withdraw(results.address, 1, function (err, account) {
        results.account = account;
        callback(err, results);
      });
    }

    var send = async.compose(withdraw, newAddress, findOne);

    send({ _id: wallet_a }, function (err, results) {
      rpc({
        method: 'listtransactions',
        params: [ results.account._id, 1 ]
      }, function (err, transaction) {
        t.equal(transaction[0].address, results.address, 'transaction address correct');
        t.equal(transaction[0].category, 'send', 'transaction category correct');
        t.equal(transaction[0].amount, -1, 'transaction amount correct');
        t.end();
      });
    });
  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});
