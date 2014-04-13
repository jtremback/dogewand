'use strict';

var async = require('async');
var _ = require('lodash');
var config = require('../config/config')('test');
var DogeAPI = require('dogeapi');
var dogeApi = new DogeAPI(config.dogeapi.creds);

exports.resetBalances = function (callback) {
  dogeApi.getUsers(function (err, users) {
    if (err) return callback(err);
    console.log(users)

    async.each(users, function (user, cb) {
      if (user.user_balance === 0 || user.user_id === config.dogeapi.root) return cb(); // If account balance is 0 or account is root
      dogeApi.moveToUser(config.dogeapi.root, user.user_id, 6, cb);
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