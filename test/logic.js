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

var TIMEOUT = 2000;

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




  // t.test('createTip to existing account', function (t) {
  //   var opts = {
  //     username: wallet_b.username,
  //     provider: wallet_b.provider,
  //     amount: amount
  //   };

  //   logic.createTip(wallet_a, opts, function (err) {
  //     t.error(err, 'createTip');

  //     setTimeout(function () {
  //       // Check tip in mongo
  //       // Check transaction
  //       // Check sender account in mongo
  //       // Check sender balance
  //       // Check receiver account in mongo

  //       rpc({
  //         method: 'listtransactions',
  //         params: [ wallet_a._id, 1 ]
  //       }, function (err, result) {
  //         t.error(err);
  //         result = result[0];
  //         t.equal(result.amount, -amount, 'dogecoind amount correct');
  //         t.equal(result.otheraccount, '', 'dogecoind otheraccount correct');
  //         getBalances([wallet_a._id, wallet_b._id], function (err, new_balances) {
  //           // t.equal(old_balances[0] - amount, new_balances[0], 'tipper acct. debited');
  //           // t.equal(old_balances[1] + amount, new_balances[1], 'root acct. credited');
  //           console.log('balances', new_balances)
  //           t.end();
  //         });
  //       });
  //     }, TIMEOUT);
  //   });
  // });

  // t.test('createTip to nonexistant account', function (t) {
  //   var opts = {
  //     username: 'Chewbacca',
  //     provider: 'farcebook',
  //     amount: amount
  //   };

  //   logic.createTip(wallet_a, opts, function (err) {
  //     t.error(err, 'createTip');

  //     setTimeout(function () {
  //       // Check tip in mongo
  //       // Check transaction
  //       // Check sender account in mongo
  //       // Check sender balance
  //       // Check receiver account in mongo

  //       rpc({
  //         method: 'listtransactions',
  //         params: [ wallet_a._id, 1 ]
  //       }, function (err, result) {
  //         t.error(err);
  //         result = result[0];
  //         t.equal(result.amount, -amount, 'dogecoind amount correct');
  //         t.equal(result.otheraccount, '', 'dogecoind otheraccount correct');

  //         getBalances([wallet_a._id, wallet_b._id], function (err, new_balances) {
  //           // t.equal(old_balances[0] - amount, new_balances[0], 'tipper acct. debited');
  //           // t.equal(old_balances[1] + amount, new_balances[1], 'root acct. credited');
  //           console.log('balances', new_balances);
  //           t.end();
  //         });

  //       });

  //     }, TIMEOUT);
  //   });
  // });

  t.test('Try to hack', function (t) {
    var opts1 = {
      username: wallet_b.username,
      provider: wallet_b.provider,
      amount: 3
    };

    var opts2 = {
      username: 'Chewbacca',
      provider: 'farcebook',
      amount: 3
    };


    logic.createTip(wallet_a, opts1, function (err) {
      t.error(err, 'createTip');
    });

    logic.createTip(wallet_a, opts2, function (err) {
      t.error(err, 'createTip');

      setTimeout(function () {
        rpc({
          method: 'listtransactions',
          params: [ wallet_a._id, 2 ]
        }, function (err, result) {
          console.log('TRANSACTION', result)
          // t.error(err);
          // result = result[0];
          // t.equal(result.amount, -6, 'dogecoind amount correct');
          // t.equal(result.otheraccount, '', 'dogecoind otheraccount correct');
          getBalances([wallet_a._id], function (err, new_balances) {
            // t.equal(old_balances[0] - amount, new_balances[0], 'tipper acct. debited');
            // t.equal(old_balances[1] + amount, new_balances[1], 'root acct. credited');
            console.log('BALANCE', new_balances);
            t.end();
          });
        });
      }, TIMEOUT);
    });
  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});