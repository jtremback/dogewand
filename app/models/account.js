'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/config')();
var rpc = require('../rpc')(config.rpc);

var AccountSchema = new Schema({
  balance: { type: Number, default: 0 }, // updateBalance should be used whenever the balance is changed or read from dogecoind
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

  ,

  getTips: function (direction, state, callback) {
    var self = this;

    var query = self.find();

    if (direction === 'in') {
      query.where({ tipper_id: self._id });
    }
    else if (direction === 'out') {
      query.where({ tippee_id: self._id });
    }
    else if (direction === 'all') {
      query.or([{ tipper_id: self._id }, { tippee_id: self._id }]);
    }
    else {
      callback(400);
    }

    if (state === 'claimed') {
      query.where({ state: 'claimed' });
    }
    else if (state === 'canceled') {
      query.where({ state: 'canceled' });
    }
    else if (state === 'created') {
      query.where({ state: 'canceled' });
    }
    else if (state === 'all') {
      query.where({ state: { $in: [ 'claimed', 'canceled', 'created' ] } });
    }
    else {
      callback(400);
    }

    query.exec(callback);
  }
};


mongoose.model('Account', AccountSchema);