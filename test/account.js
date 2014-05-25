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


function asyncTimeout (fn, timeout) {
    setTimeout(fn, timeout);
}

function decimalRound (number, divisions) {
  var integer = number * divisions;
  return Math.round(integer) / divisions;
}

var TIMEOUT = 1000;
var FEE = 1;

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



  t.test('deposit and withdraw', function (t) {

    var sender = wallet_a;
    var reciever = wallet_b;

    var start_balance = 3.09;
    var amount = 1;

    utility.resetBalances(function () {
      utility.seedFunds(sender, start_balance, function (err, sender) {
        t.error(err);

        reciever.getAddress(function (err, address) {
          t.error(err);

          logic.withdraw(sender, address, amount, function (err, account) {
            t.error(err);

            asyncTimeout(function () {
              async.parallel({

                sender_balance: async.apply(rpc, {
                  method: 'getbalance',
                  params: [sender._id]
                })

                ,

                transaction: async.apply(rpc, {
                  method: 'listtransactions',
                  params: [ sender._id, 1 ]
                })

                ,

                sender: function (cb) {
                  Account.findOne({ _id: sender._id }, cb);
                }

              }, function (err, results) {
                t.error(err);

                t.equal(decimalRound(start_balance - amount - FEE, 100), results.sender_balance, 'right sender balance');
                t.equal(results.sender.balance, results.sender_balance, 'dogecoind and mongo sender balance');

                t.equal(amount, -results.transaction[0].amount, 'dogecoind amount');
                t.equal(FEE, -results.transaction[0].fee, 'dogecoind fee');

                t.end();
              });
            }, TIMEOUT);

          });
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
