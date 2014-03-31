'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var async = require('async');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);
var utility = require('../test-utility');
// var models = require('../test-utility/models.js');

// var Tip = models.Account;
// var Account = models.Account;


// var app = require('../');


function getBalances(_ids, callback) {
  async.map(_ids, iterator, callback);

  function iterator (_id, cb) {
    rpc({
      method: 'getbalance',
      params: [_id]
    }, cb);
  }
}

test('- API controller', function (t) {
  // Connect to mongodb
  mongoose.connect(config.db, {
    auto_reconnect: true,
    server: {
      socketOptions: {
        keepAlive: 1
      }
    }
  });

  // Bootstrap models
  var fs = require('fs');
  var path = require('path');
  var models_path = path.resolve(__dirname, '../app/models');
  fs.readdirSync(models_path).forEach(function (file) {
    if (~file.indexOf('.js')) require(models_path + '/' + file);
  });

  var Tip = mongoose.model('Tip');
  var Account = mongoose.model('Account');


  // Needs to be required under models
  var logic = require('../app/controllers/logic.js');

  var amount = 1;

  var accounts;

  t.test('setup', function (t) {
    var opts = [{
      username: 'Jehoon',
      provider: 'farcebook'
    }, {
      username: 'C3P0',
      provider: 'farcebook'
    }];

    async.series([
      async.apply(utility.resetMongo, [ Tip, Account ]),
      async.apply(utility.fakeAccounts, Account, opts),
      utility.resetBalances
    ], function (err, results) {
      t.error(err);
      accounts = results[1];
      seedFunds();
    });

    function seedFunds () {
      rpc({
        method: 'move', // Move some funds to test with
        params: ['', accounts[0]._id, 6]
      }, function (err) {
        t.error(err);
        t.end();
      });
    }
  });

  t.test('createTip to existing account', function (t) {
    var opts = {
      username: accounts[1].username,
      provider: accounts[1].provider,
      amount: amount
    };

    getBalances([accounts[0]._id, ''], function (err, old_balances) {
      logic.createTip(accounts[0], opts, function (err, tip, tipper, tippee) {
        t.error(err, 'createTip');

        getBalances([accounts[0]._id, ''], function (err, new_balances) {
          t.equal(old_balances[0] - amount, new_balances[0], 'tipper acct. debited');
          t.equal(old_balances[1] + amount, new_balances[1], 'root acct. credited');
        });

        t.equal(accounts[0]._id.toString(), tip.tipper_id.toString(), 'tip.tipper_id correct');
        t.equal(accounts[0]._id.toString(), tipper._id.toString(), 'tipper._id correct');

        t.equal(accounts[1]._id.toString(), tip.tippee_id.toString(), 'tip.tippee_id correct');
        t.equal(accounts[1]._id.toString(), tippee._id.toString(), 'tippee._id correct');

        t.end();
      });
    });
  });

  t.test('createTip to nonexistant account', function (t) {
    var opts = {
      username: 'Chewbacca',
      provider: 'farcebook',
      amount: amount
    };

    logic.createTip(accounts[0], opts, function (err, tip, tipper, tippee) {
      t.error(err, 'createTip');

      t.equal(tippee._id, tip.tippee_id, 'tippee_id correct');
      t.equal(opts.username, tippee.username, 'tippee.username correct');
      t.equal(opts.provider, tippee.provider, 'tippee.provider correct');
      t.end();
    });
  });

  t.test('end', function (t) {
    mongoose.disconnect(function () {
      t.end();
    });
  });
});