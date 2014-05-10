'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/config')();
var rpc = require('../rpc')(config.rpc);
var check = require('check-types');
var bcrypt = require('bcrypt');

var AccountSchema = new Schema({
  balance: { type: Number, default: 0 }, // updateBalance should be used whenever the balance is changed or read from dogecoind
  provider: String,
  username: String,
  password: String
});

// Bcrypt middleware
AccountSchema.pre('save', function(next) {
  var self = this;

  if(!self.isModified('password')) return next();

  bcrypt.genSalt(10, function(err, salt) {
    if(err) return next(err);

    bcrypt.hash(self.password, salt, function(err, hash) {
      if(err) return next(err);
      self.password = hash;
      next();
    });
  });
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
          'username': opts.username,
          'provider': opts.provider,
          'password': opts.password
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
      if (err) return callback(err);
      if (!account) return callback('no account found');
      account[method](function (err, account) {
        if (err) return callback(err);
        return callback(err, account);
      });
    });
  }

  ,


  // Must be called by queue
  withdraw: function (account, to_address, amount, callback) {
    if (!check.positiveNumber(amount)) return callback(new Error('Invalid amount.'));

    account.updateBalance(function (err, tipper) {
      var balance = tipper.balance;

      if ((balance - amount) >= 0) { // Check funds
        rpc({
          method: 'sendfrom',
          params: [ account.id, to_address, amount ]
        }, function (err) {
          if (err) return callback(err);
          account.updateBalance(callback);
        });
      }

      return console.log('Not enough dogecoin to withdraw.', tipper, amount);
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
    }, function (err, response) {
      return callback(null, response);
    });
  }

  ,

  authenticate: function (plaintext, callback) {
    bcrypt.compare(plaintext, this.password, callback);
  }
};


mongoose.model('Account', AccountSchema);
