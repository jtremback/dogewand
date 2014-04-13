'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/config')();
var DogeAPI = require('../src/index.js');
var dogeApi = new DogeAPI(config.dogeapi.creds);

var AccountSchema = new Schema({
  balance: { type: Number, default: 0 }, // updateBalance should be used whenever the balance is changed or read from dogecoind
  provider: String,
  username: String,
  address: String
});


AccountSchema.statics = {

  // opts = {
  //   provider,
  //   username
  // }
  upsert: function (opts, callback) {
    var Self = this;

    Self.findOne(opts, function (err, account) {
      if (err) return callback(err);
      if (!account) {
        account = new Self({
          'username': opts.username,
          'provider': opts.provider
        });
        dogeApi.createUser(account._id, function (err, address) {
          if (err) return callback(err);
          account.address = address;
          return account.save(callback);
        });
      }
      else {
        return callback(err, account);
      }
    });
  }

  ,

  withdraw: function (account_id, to_address, amount, callback) {
    var Self = this;
    Self.findOne({ _id: account_id }, function (err, account) {
      dogeApi.withdrawFromUser(account_id, to_address, amount, config.dogeapi.pin, function (err) {
        if (err) return callback(err);
        account.updateBalance(callback);
      });
    });
  }
};


AccountSchema.methods = {
  // Gets balance and updates mongo at the same time
  // IMPORTANT: Do not use the balance in mongo for anything important!!! It is for display only.
  // Get the balance for important things using this method instead.
  //
  updateBalance: function (callback) {
    var self = this;

    dogeApi.getUserBalance(self._id, function (err, balance) {
      if (err) return callback(err);
      self.balance = balance;
      self.save(callback);
    });
  }
};