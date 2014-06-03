'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/config')();
var rpc = require('../rpc')(config.rpc);
var check = require('check-types');
var bcrypt = require('bcrypt');
var _ = require('lodash');

var AccountSchema = new Schema({
  provider: String,
  uniqid: String,
  password: String
});

var UserSchema = new Schema({
  balance: { type: Number, default: 0 }, // updateBalance should be used whenever the balance is changed or read from dogecoind
  pending: { type: Number, default: 0 },
  accounts: [ AccountSchema ],
  username: String
});

// Bcrypt middleware
UserSchema.pre('save', function(next) {
  var self = this;
  var localInfo = _.find(self.accounts, function(account) {
    return account.provider === 'dogewand'; // Find first account with dogewand provider
  });
  if (localInfo === undefined) return next();
  if (!localInfo.isModified('password')) return next();

  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);

    bcrypt.hash(localInfo.password, salt, function(err, hash) {
      if (err) return next(err);
      localInfo.password = hash;
      next();
    });
  });
});

UserSchema.statics = {

  upsert: function (opts, callback) {
    var Self = this;

    Self.findOne({ accounts: { $elemMatch: { 'provider': opts.provider, 'uniqid': opts.uniqid } } }, function (err, user) {
      if (err) { return callback(err); }
      if (!user) {
        user = new Self({
          accounts: [{
            provider: opts.provider,
            uniqid: opts.uniqid,
            password: opts.password
          }]
        });
        return user.save(callback);
      }
      else {
        return callback(err, user);
      }
    });
  }

  ,

  // Must be called by queue
  withdraw: function (user, to_address, amount, callback) {
    if (!check.positiveNumber(amount)) return callback(new Error('Invalid amount.'));

    user.updateBalance(function (err, tipper) {
      var balance = tipper.balance;

      if ((balance - amount) >= 0) { // Check funds
        rpc({
          method: 'sendfrom',
          params: [ user.id, to_address, amount ]
        }, function (err) {
          if (err) return callback(err);
          return tipper.updateBalance(callback);
        });
      }

      else return console.log('Not enough dogecoin to withdraw.', tipper, amount);
    });
  }
};


UserSchema.methods = {

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

  getAddress: function (callback) {
    var self = this;

    rpc({
      method: 'getaccountaddress',
      params: [ self._id ]
    }, function (err, response) {
      return callback(null, response);
    });
  }

  ,

  authenticate: function (plaintext, callback) {
    var self = this;

    var localInfo = _.find(self.accounts, function(account) {
      return account.provider === 'dogewand';
    });
    bcrypt.compare(plaintext, localInfo.password, callback);
  }

  ,

  linkAccount: function(account, callback) {
    this.accounts.push(account);
    this.save(callback);
  }
};


mongoose.model('User', UserSchema);
