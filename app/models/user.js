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
  name: String,
  uniqid: String,
  password: String
});

var UserSchema = new Schema({
  balance: { type: Number, default: 0 }, // updateBalance should be used whenever the balance is changed or read from dogecoind
  accounts: [ AccountSchema ],
  state: String
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
            name: opts.name,
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

  ,

  // Should be called from queue
  mergeUsers: function (from_user, to_user, callback) {
    from_user.updateBalance(function (err, from_user) {
      if (err) return  callback(err);
      var balance = from_user.balance;

      if (balance > 0) {
        rpc({
          method: 'move',
          params: [ from_user._id, to_user._id, balance, 6 ]
        }, function (err) {
          if (err) return  callback(err);
          return mergeAuth(from_user);
        });
      }
      else {
        return mergeAuth(from_user);
      }
    });

    function mergeAuth (from_user) {
      to_user.accounts = to_user.accounts.concat(from_user.accounts);
      to_user.state = 'merging';
      to_user.save(function (err, to_user) {
        if (err) return callback(err);
        from_user.remove(function (err) {
          if (err) return callback(err);
          to_user.state = 'clean';
          return to_user.save(callback);
        });
      });
    }
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

  linkAccount: function (account, callback) {
    this.accounts.push(account);
    this.save(callback);
  }
};


mongoose.model('User', UserSchema);
