'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var fs = require('fs');
var path = require('path');
var utility = require('../test-utility');


test('====Account model====', function (t) {
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

  var wallet_a;
  var wallet_b;


  t.test('upsert', function (t) {
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
      async.apply(utility.fakeAccounts, Account, opts) // This does the upserting
    ], function (err, results) {
      t.notOk(err);

      wallet_a = results[1][0]._id.toString(); // Save for later
      wallet_b = results[1][1]._id.toString();

      t.notEqual(wallet_a, results[1][2]._id.toString()); // Make sure we are really upserting
      t.end();
    });
  });


  t.test('findCall and updateBalance', function (t) {
    utility.resetBalances(function () {
      rpc({
        method: 'move', // Move some funds to test with
        params: ['', wallet_a, 6]
      }, function (err) {
        t.notOk(err);
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
