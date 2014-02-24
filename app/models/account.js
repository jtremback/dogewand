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

// Gets balance and updates mongo at the same time
// IMPORTANT: Do not use the balance in mongo for anything important!!!
// Get it using this method instead.
// 
// updateBalance(context, [id], [callback])
// 
// function updateBalance (context, id, callback) {
//   var _id = id ? id : context._id;

//   var body = {
//     method: 'getbalance',
//     params: [ _id ]
//   };

//   rpc(body, function (err, response) {
//     var balance = response ? response.result : null;
//     console.log('updateBalance', (id ? 'static' : 'method'), _id, balance);

//     if (id) { // Checks if it was a static method with supplied id
//       context.findById(_id, function (err, account) {
//         account.balance = balance;
//         account.save(function (err, account) {
//           if (typeof callback === 'function') return callback(err, account.balance);
//           return;
//         });
//       });
//     }

//     else {
//       context.balance = balance;
//       context.save(function (err, account) {
//         if (typeof callback === 'function') return callback(err, account.balance);
//         return;
//       });
//     }
//   });
// }

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
        return account.save(callback);
      }
      else {
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

    rpc(body, function (err, result) {
      if (err) return callback(err);
      Self.findById(id, function (err, account) {
        account.balance = result;
        account.save(function (err, account) {
          return callback(err, account.balance);
        });
      });
    });
    // updateBalance(this, id, callback);
  }
};


AccountSchema.methods = {

  // Gets balance and updates mongo at the same time
  updateBalance: function (callback) {
    // var self = this;

    // var body = {
    //   method: 'getbalance',
    //   params: [ self.id ]
    // };

    // rpc(body, function (err, response) {
    //   if (callback) {
    //     return callback(err, response ? response.result : null);
    //   }
    //   if (response) {
    //     self.update({ balance: response.result});
    //   }
    // });
    updateBalance(this, null, callback);
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