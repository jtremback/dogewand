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


  t.test('createTip to nonexistant user', function (t) {
    var opts = {
      uniqid: 'Chewbacca',
      provider: 'farcebook',
      amount: 1.57
    };

    utility.resetBalances(function () {
      utility.seedFunds(wallet_a, opts.amount, function () {
        checkTipCreatedStarted(t, wallet_a, opts);
      });
    });
  });


  t.test('createTip to existing user', function (t) {
    var opts = {
      uniqid: 'hamster',
      provider: 'farcebook',
      amount: 1.35
    };

    utility.resetBalances(function () {
      utility.seedFunds(wallet_a, opts.amount, function () {
        User.upsert(opts, function () {
          checkTipCreatedStarted(t, wallet_a, opts);
        });
      });
    });
  });


  function checkTipCreatedStarted (t, user, opts) {

    logic.createTip(wallet_a, opts, function (err) {
      t.error(err, 'createTip');
      // Check new balance
      // Check tip_id


      asyncTimeout(function () {
        checkTipCreatedFinished(t, user, opts);
      }, TIMEOUT);
    });

  }


  function checkTipCreatedFinished (t, tipper, opts) {
    User.findOne({ accounts: { $elemMatch: { 'provider': opts.provider, 'uniqid': opts.uniqid } } }, function (err, tippee) {

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
          User.findOne({ _id: tipper._id }, cb);
        }

      }, function (err, results) {
        t.error(err);


        t.equal(results.tipper.balance, results.tipper_balance, 'dogecoind tipper balance');

        t.equal(opts.amount, -results.transaction[0].amount, 'dogecoind amount');

        t.equals(results.tipper.pending, 0, 'pending resolved');

        t.equal(opts.uniqid, tippee.accounts[0].uniqid, 'mongo tippee uniqid');
        t.equal(opts.provider, tippee.accounts[0].provider, 'mongo tippee provider');

        t.equal(tipper.id, results.tip.tipper_id.toString(), 'mongo tip tipper_id');
        t.equal(tippee.id, results.tip.tippee_id.toString(), 'mongo tip tippee _id');
        t.equal(opts.amount, results.tip.amount, 'mongo tip amount');
        t.equal(results.tip.state, 'created', 'mongo tip state');

        t.end();
      });
    });
  }



  t.test('Try to hack', function (t) {
    var opts1 = {
      uniqid: 'Lando',
      provider: 'farcebook',
      amount: 4
    };
    var opts2 = {
      uniqid: 'Han.solo',
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

        asyncTimeout(function () {
          async.parallel({
            tipper_balance: async.apply(rpc, {
              method: 'getbalance',
              params: [wallet_a._id]
            })

            ,

            failed_tip: function (callback) {
              User.find({ accounts: { $elemMatch: { 'uniqid': opts2.uniqid } } }, function (err, user) {
                t.error(err);
                Tip.find({ tippee_id: user[0]._id }, {}, { sort: { 'created_at' : 1 } }, callback);
              });
            }
          },

          function (err, results) {
            t.error(err);
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

  // RESOLVE
  // tippee has increased balance
  // main has decreased balance
  // tip state is correct
  // tip recipient_id is correct

  t.test('cancel', function (t) {
    var opts = {
      uniqid: 'Chewbacca',
      provider: 'farcebook',
      amount: 1.94
    };

    utility.resetBalances(function () {
      utility.seedFunds(wallet_a, opts.amount, function (err, user) {
        logic.createTip(user, opts, function (err, balance, tip_id) {
          asyncTimeout(function () {
            checkTipResolvedStarted(t, user, opts, tip_id);
          }, TIMEOUT);
        });
      });
    });
  });


  t.test('claim', function (t) {
    var opts = {
      uniqid: 'Hercules',
      provider: 'farcebook',
      amount: 1.12
    };

    utility.seedFunds(wallet_a, opts.amount, function (err, user) {
      logic.createTip(user, opts, function (err, user, tip_id) {
        asyncTimeout(function () {
          checkTipResolvedStarted(t, user, opts, tip_id);
        }, TIMEOUT);
      });
    });
  });

  function checkTipResolvedStarted (t, user, opts, tip_id) {
    logic.resolveTip(tip_id, user, function (err, balance) {
      t.error(err, 'resolveTip');
      // Check balance
      // TODO test immediate response

      asyncTimeout(function () {
        checkTipResolvedFinished(t, user, opts, tip_id);
      }, TIMEOUT);
    });
  }

  function checkTipResolvedFinished (t, user, opts, tip_id) {
    async.parallel({
      transaction: async.apply(rpc, {
        method: 'listtransactions',
        params: [ user.id, 1 ]
      })

      ,

      tip: function (cb) {
        Tip.findOne({ _id: tip_id }, cb);
      }

      ,

      user: function (cb) {
        User.findOne({ _id: user._id }, cb);
      }
    }, function (err, results) {
      // Convert the goddamn mongo objectids
      var recipient_id = results.tip.recipient_id.toString();
      var resolved_id = results.tip.resolved_id.toString();
      var tippee_id = results.tip.tippee_id.toString();
      var tipper_id = results.tip.tipper_id.toString();

      console.log('RESULTS TRANSACTION', results.transaction);

      // Check state
      // Check resolved_id
      // Check recipient_id
      t.equals(user.id, recipient_id, 'mongo recipient_id correct');

      if (user.id === tippee_id) {
        t.equals(results.tip.state, 'claimed', 'mongo tip state is correct');
      } else if (user.id === tipper_id) {
        t.equals(results.tip.state, 'canceled', 'mongo tip state is correct');
      } else {
        t.fail('wrong account resolved');
      }

      t.equals(results.user.pending, 0, 'pending resolved');

      // Check transaction
      var transaction = results.transaction[0];

      t.equals(transaction.account, user.id, 'users match');
      t.equals(transaction.amount, opts.amount, 'amounts match');
      t.equals(transaction.otheraccount, '', 'otheraccount correct');
      t.equals(transaction.comment, resolved_id, 'resolved id and tx comment');
      t.end();

    });
  }

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      asyncTimeout(function () {
        t.end();
        process.exit();
      }, TIMEOUT);
    });
  });
});