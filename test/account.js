'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var fs = require('fs');
var path = require('path');
var utility = require('../test-utility');


test('- Account model', function (t) {
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
  var amount = 1;


  t.test('upsert', function (t) {
    var accounts = [{
      username: 'Jehoon',
      provider: 'farcebook'
    }, {
      username: 'C3P0',
      provider: 'farcebook'
    }, {
      username: 'Jehoon', // 2 accounts with same accounts- test upserting
      provider: 'farcebook'
    }];

    async.series([
      async.apply(utility.resetMongo, [ Tip, Account ]),
      async.apply(utility.fakeAccounts, Account, accounts) // This does the upserting
    ], function (err, results) {
      t.error(err);

      wallet_a = results[1][0]; // Save for later
      wallet_b = results[1][1];

      t.equal(results[1][0].providers[0].username, 'Jehoon');
      t.equal(results[1][0].providers[0].provider, 'farcebook');

      t.notEqual(wallet_a, results[1][2]._id.toString()); // Make sure we are really upserting
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

  //// Making a strategic decision not to test getTips right now,
  //// because it is only for display and is a huge pain to test.

  // t.test('getTips', function (t) {
  //   var directions = [
  //     'in',
  //     'out',
  //     'all'
  //   ];

  //   var states = [
  //     'created',
  //     'claimed',
  //     'canceled',
  //     'all'
  //   ];

  //   async.each(directions, function (direction, callback) {
  //     async.map(states, function (state, callback) {
  //       var tipper;
  //       var tippee;

  //       if (direction === 'in') {
  //         tippee = wallet_a;
  //         tipper = wallet_b;
  //       }

  //       else if (direction === 'out') {
  //         tippee = wallet_b;
  //         tipper = wallet_a;
  //       }

  //       Tip.create(tipper, tippee, amount, function (err, tip) {
  //         if (state === 'claimed') {
  //           return tip.resolve(tippee, callback);
  //         }
  //         else if (state === 'canceled') {
  //           return tip.resolve(tipper, callback);
  //         }
  //       });
  //     });
  //   }, function (err, results) {
  //     t.error(err);
  //     async.each(results, function (, callback) {

  //     });
  //   });

  //   function check (tip, direction, state) {
  //     if (state === 'all') {

  //     }
  //   }
  // });


  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});
