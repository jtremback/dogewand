'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/config')();
var rpc = require('../rpc')(config.rpc);

var AccountSchema = new Schema({
  balance: Number, // updateBalance should be used whenever the balance is changed or read from dogecoind
  providers: [
    { provider: String, username: String }
  ]
});


AccountSchema.statics = {

  // opts = { 
  //   provider,
  //   username
  // }
  upsert: function (opts, callback) {
    var Self = this;

    Self.findOne(opts, function (err, account) {
      if (err) { return callback(err); }
      if (!account) {
        account = new Self({
          'providers': [{
            'username': opts.username,
            'provider': opts.provider
          }]
        });
        return account.save(callback);
      }
      else {
        return callback(err, account);
      }
    });
  }

  ,

  // Wraps methods in a findOne call
  findCall: function (method, conditions, callback) {
    var Self = this;

    Self.findOne(conditions, function (err, account) {
      console.log(account);
      if (err) return callback(err);
      if (!account) return callback('no account found');
      account[method](function (err, account) {
        if (err) return callback(err);
        return callback(err, account);
      });
    });
  }
};


AccountSchema.methods = {

  // Gets balance and updates mongo at the same time
  // IMPORTANT: Do not use the balance in mongo for anything important!!!
  // Get it using this method instead.
  // 
  updateBalance: function (callback) {
    var self = this;

    rpc({
      method: 'getbalance',
      params: [ self._id ]
    }, function (err, result) {
      if (err) return callback(err);
      self.balance = result;
      self.save(callback);
    });
  }

  ,

  newAddress: function (callback) {
    var self = this;

    rpc({
      method: 'getnewaddress',
      params: [ self._id ]
    }, callback);
  }

  ,

  withdraw: function (to_adress, amount, callback) {
    var self = this;

    rpc({
      method: 'sendfrom',
      params: [ self._id, to_adress, amount ]
    }, function (err, result) {
      console.log(result);
      if (err) return callback(err);
      self.updateBalance(callback);
    });
  }
};


mongoose.model('Account', AccountSchema);