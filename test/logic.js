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

var TIMEOUT = 1000;

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
      t.error(err);
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

    checkTipStarted(t, wallet_a, opts);
  });



  t.test('createTip to nonexistant account', function (t) {
    var opts = {
      username: 'Chewbacca',
      provider: 'farcebook',
      amount: amount
    };

    checkTipStarted(t, wallet_a, opts);
  });


  function checkTipStarted (t, account, opts) {
    utility.seedFunds(wallet_a, opts.amount, function () {
      logic.createTip(wallet_a, opts, function (err) {
        t.error(err, 'createTip');
        // Check new balance
        // Check tip_id


        setTimeout(function () {
          checkTipFinished(t, account, opts);
        }, TIMEOUT);
      });
    });
  }


  function checkTipFinished (t, tipper, opts) {
    Account.findOne({ username: opts.username }, function (err, tippee) {
      async.parallel({

        tipper_balance: async.apply(rpc, {
          method: 'getbalance',
          params: [tipper._id]
        })

        ,

        transaction: async.apply(rpc, {
          method: 'listtransactions',
          params: [ tipper._id, 1 ]
        })

        ,

        tip: function (cb) {
          Tip.findOne({ tippee_id: tippee._id }, {}, { sort: { 'created_at' : -1 } }, cb);
        }

        ,

        tipper: function (cb) {
          Account.findOne({ _id: tipper._id }, cb);
        }

      }, function (err, results) {
        t.error(err);

        // console.log('OPTS', opts)
        // console.log('TIPPER', tipper)
        // console.log('RESULTS', results)

        t.equal(results.tipper.balance, results.tipper_balance, 'dogecoind tipper balance');

        t.equal(opts.amount, -results.transaction[0].amount, 'dogecoind amount');

        t.equal(opts.username, tippee.username, 'mongo tippee username');
        t.equal(opts.provider, tippee.provider, 'mongo tippee provider');

        t.equal(tipper._id.toString(), results.tip.tipper_id.toString(), 'mongo tip tipper_id');
        t.equal(tippee._id.toString(), results.tip.tippee_id.toString(), 'mongo tip tippee _id');
        t.equal(opts.amount, results.tip.amount, 'mongo tip amount');
        t.equal('created', results.tip.state, 'mongo tip state');

        utility.emptyAccount(wallet_a, function () {
          t.end();
        });
      });
    });
  }



  t.test('Try to hack', function (t) {
    var opts1 = {
      username: 'Lando',
      provider: 'farcebook',
      amount: 4
    };
    var opts2 = {
      username: 'Han.solo',
      provider: 'farcebook',
      amount: 3
    };

    utility.seedFunds(wallet_a, 6, function () {
      // Create two tips in quick succesion to try to fool system into allowing negative balance
      //
      // Check that account is not debited
      // Check that 'insufficient' tip is recorded
      logic.createTip(wallet_a, opts1, function (err) {
        t.error(err, 'createTip 1');
      });
      logic.createTip(wallet_a, opts2, function (err) {
        t.error(err, 'createTip 2');

        setTimeout(function () {
          async.parallel({
            tipper_balance: async.apply(rpc, {
              method: 'getbalance',
              params: [wallet_a._id]
            })

            ,

            failed_tip: function (callback) {
              Account.find({ username: opts2.username }, function (err, account) {
                t.error(err);
                // console.log('ACCOUNT', account)
                Tip.find({ tippee_id: account[0]._id }, {}, { sort: { 'created_at' : 1 } }, callback);
              });
            }
          },

          function (err, results) {
            t.error(err);
            // console.log('ASYNC RESULTS', results)
            t.equals(results.failed_tip[0].state, 'insufficient', 'tip marked insufficient');
            t.equals(2, results.tipper_balance, 'tipper balance is right');
            utility.emptyAccount(wallet_a, function () {
              t.end();
            });
          });

        }, TIMEOUT);
      });
    });
  });

  t.test('claim', function (t) {
    var opts = {
      username: 'Chewbacca',
      provider: 'farcebook',
      amount: amount
    };

    utility.seedFunds(wallet_a, opts.amount, function () {
      logic.createTip(wallet_a, opts, function (err) {
        t.error(err, 'createTip');


        setTimeout(function () {
          checkTip(t, wallet_a, opts);
        }, TIMEOUT);
      });
    });

    t.test('end', function (t) {
      mongoose.disconnect(function () {
        t.end();
        process.exit();
      });
    });
  });
});