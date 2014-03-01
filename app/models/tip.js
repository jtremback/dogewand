'use strict';

var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var config = require('../../config/config')();
var _ = require('lodash');
var Schema = mongoose.Schema;
var ObjectID = require('mongodb').ObjectID;

var rpc = require('../rpc')(config.rpc);


var TipSchema = new Schema({
  amount: Number,
  state: String, // In case of accidents
  from_wallet: String,
  to_wallet: String,
  resolved_id: String // stored in dogecoind 'comment' field
});



TipSchema.statics = {

  // opts = {
  //   from_wallet,
  //   to_wallet,
  //   amount
  // }
  create: function (opts, callback) {
    var Self = this;

    Account.updateBalance({ _id: opts.from_wallet }, function (err, account) {
      if (err) return callback(err);
      var balance = account.balance;

      if ((balance - opts.amount) > 0) { // Check funds
        opts.state = 'creating'; // Set state

        new Self(opts).save(function (err, tip) { // Create tip in db
          if (err) return callback(err);
          return move(tip); // Next step
        });
      }

      else return callback('insufficient'); // You are BROKE!
    });

    function move (tip) {
      var body = {
        method: 'move',
        params: [ tip.from_wallet, '', tip.amount, 6, tip._id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.state = 'created'; // We did it
        Account.updateBalance({ _id: tip.from_wallet }, function () { // Update relevant account with new balance
          return tip.save(callback); // Done
        });
      });
    }
  }
};

TipSchema.methods = {

  resolve: function (operation, callback) {
    if (this.state !== 'created') return callback({ type: 'inactive' }); // Sorry, all done

    var dest;
    if (operation === 'claim') dest = this.to_wallet;
    else if (operation === 'cancel') dest = this.from_wallet;
    else return callback({type: 'operation'}); // Can not compute

    this.state = operation + 'ing';
    this.resolved_id = new ObjectID(); // resolved_id identifies the tip later
    this.save(function (err, tip) {
      if (err) return callback(err);
      return move(tip);
    });

    function move (tip) {
      var body = {
        method: 'move',
        params: [ '', dest, tip.amount, 6, tip.resolved_id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.state = operation + 'ed'; // We did it
        Account.updateBalance({ _id: dest }, function () { // Update relevant account with new balance
          tip.save(callback);
        });
      });
    }
  }

};

mongoose.model('Tip', TipSchema);