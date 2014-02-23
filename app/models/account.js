'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var config = require('../../config/config')();
var rpc = require('../rpc')(config.rpc);

var AccountSchema = new Schema({
  balance: Number, // updateBalance should be used whenever the balance is changed or read from dogecoind
  username: String,
  provider: String
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
          username: opts.username,
          provider: opts.provider
        });
        account.save(function (err) {
          if (err) console.log(err);
          return callback(err, account);
        });
      }
      else {
        console.log(account);
        return callback(err, account);
      }
    });
  }

  ,

  // Gets balance and updates mongo at the same time
  updateBalance: function (id, callback) {
    var Self = this;

    var body = {
      method: 'getbalance',
      params: [ id ]
    };

    rpc(body, function (err, response) {
      if (callback) {
        if (err) return callback(err);
        return callback(null, response.result);
      }
      if (response) {
        Self.update({ _id: id }, { balance: response.result});
      }
    });
  }
};


AccountSchema.methods = {

  // Gets balance and updates mongo at the same time
  updateBalance: function (callback) {
    var self = this;

    var body = {
      method: 'getbalance',
      params: [ self.id ]
    };

    rpc(body, function (err, response) {
      if (callback) {
        if (err) return callback(err);
        return callback(null, response.result);
      }
      if (response) {
        self.update({ balance: response.result});
      }
    });

  }
  
  ,

  newAddress: function (callback) {
    var self = this;

    var body = {
      method: 'getnewaddress',
      params: [self._id]
    };

    rpc(body, function (err, response) {
      if (err) return callback(err);
      return callback(null, response.result);
    });
  }

  ,

  // opts: {
  //   to_address, 
  //   amount
  // }

  withdraw: function (opts, callback) {
    var self = this;

    var body = {
      method: 'sendfrom',
      params: [ self._id, opts.to_adress, opts.amount ]
    };

    rpc(body, function (err, response) {
      if (err) return callback(err);

      return callback(null, response.result);
    });
  }
};


mongoose.model('Account', AccountSchema);