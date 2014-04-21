'use strict';

var async = require('async');
var _ = require('lodash');
var config = require('../config/config')('test');
var rpc = require('../app/rpc')(config.rpc);

exports.resetBalances = function (callback) {
  rpc({
    method: 'listaccounts',
    params: [0]
  }, function (err, accounts) {
    var pairs = _.pairs(accounts);

    async.each(pairs, function (pair, cb) {

      if (pair[1] === 0 || pair[0] === '') return cb(); // If account balance is 0 or account is root

      var params;
      if (pair[1] < 0) params = [ '', pair[0], -pair[1] ]; // If balance is less than 0, move other direction
      else params = [ pair[0], '', pair[1] ]; // Otherwise move amount to root

      rpc({
        method: 'move',
        params: params
      }, cb);

    }, callback);
  });
};

exports.resetMongo = function (Models, callback) {
  async.each(Models, function (Model, cb) {
    Model.find({}).remove(cb);
  }, callback);
};

exports.fakeAccounts = function (Account, opts, callback) {
  async.map(opts, function (opts, cb) {
    Account.upsert(opts, cb);
  }, callback);
};

exports.init = function (Tip, Account, accounts, callback) {

  async.series([
    async.apply(exports.resetMongo, [ Tip, Account ]),
    async.apply(exports.fakeAccounts, Account, accounts),
    exports.resetBalances
  ], function (err, results) {
    if (err) return callback(err);
    var wallet_a = results[1][0];
    var wallet_b = results[1][1];
    callback(null, wallet_a, wallet_b);
  });
};


// Moves funds from main account to wallets directly
exports.seedFunds = function (account, amount, callback) {
  rpc({
    method: 'move', // Move some funds to test with
    params: [ '', account._id, amount ]
  }, function (err) {
    if (err) return callback(err);
    account.updateBalance(function (err) {
      if (err) return callback(err);
      return callback(null, account);
    });
  });
};

exports.emptyAccount = function (account, callback) {
  rpc({
    method: 'getbalance',
    params: [ account._id ]
  }, function (err, result) {
    if (err) return callback(err);
    rpc({
      method: 'move',
      params: [account._id, '', result]
    }, callback);
  });
};