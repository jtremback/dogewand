'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var utility = require('../test-utility');
require('../app/models/user.js');
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

test('---------------------------------------- user.js', function (t) {
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
  var User = mongoose.model('User');

  var wallet_a;

  t.test('reset', function (t) {
    var opts = {
      provider: 'farcebook',
      uniqid: 'Jehoon'
    };

    utility.resetMongo([ Tip, User ], function () {
      User.upsert(opts, function (err, user) {
        wallet_a = user;
        t.end();
      });
    });
  });


  t.test('updateBalance', function (t) {
    var opts = {
      uniqid: 'Chewbacca',
      provider: 'farcebook',
      amount: 1.57
    };

    utility.resetBalances(function () {
      utility.seedFunds(wallet_a, opts.amount, function (err, wallet_a) {
        wallet_a.updateBalance(function (err, user) {
          t.equal(opts.amount, user.balance);
          t.end();
        });
      });
    });
  });


  t.test('deposit, getAddress, withdraw', function (t) {

    var sender = wallet_a;
    var reciever;

    var opts = {
      provider: 'farcebook',
      uniqid: 'Jehoon'
    };

    User.upsert(opts, function (err, user) {
      reciever = user;
    });

    var start_balance = 3.09;
    var amount = 1;

    utility.resetBalances(function () {
      utility.seedFunds(sender, start_balance, function (err, sender) {
        reciever.getAddress(function (err, address) {
          t.error(err);

          logic.withdraw(sender, address, amount, function (err) {
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
                  User.findOne({ _id: sender._id }, cb);
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

  t.test('mergeUsers', function (t) {

  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
      process.exit();
    });
  });
});


