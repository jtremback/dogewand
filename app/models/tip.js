'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var _ = require('lodash');
var config = require('../../config/config')();
// var _ = require('lodash');
var Schema = mongoose.Schema;
var ObjectID = require('mongodb').ObjectID;

var rpc = require('../rpc')(config.rpc);


var TipSchema = new Schema({
  amount: Number,
  state: String,
  tipper: {
    uniqid: String,
    provider: String,
    name: String
  },
  tippee: {
    uniqid: String,
    provider: String,
    name: String
  },
  recipient_id: { type: Schema.Types.ObjectId, ref: 'User' },
  resolved_id: { type: Schema.Types.ObjectId } // stored in dogecoind 'comment' field
});



TipSchema.statics = {

  // Must be called by queue
  create: function (user, tip_opts, callback) {
    var Self = this;

    user.updateBalance(function (err, user) {
      if (err) return callback(err);
      var balance = user.balance;

      var tip = new Self({ // Gotta write this all out, don't know why
        _id: tip_opts._id,
        amount: tip_opts.amount,
        tipper: {
          uniqid: tip_opts.tipper.uniqid,
          provider: tip_opts.tipper.provider,
          name: tip_opts.tipper.name
        },
        tippee: {
          uniqid: tip_opts.tippee.uniqid,
          provider: tip_opts.tippee.provider,
          name: tip_opts.tippee.name
        }
      });

      if ((balance - tip.amount) >= 0) { // Check funds
        tip.state = 'creating';
      }

      else { // If insufficient funds
        tip.state = 'insufficient';
        user.pending = user.pending + tip.amount; // And close out pending
      }


      tip.save(function (err, tip) { // Create tip in db
        if (err) return callback(err);
        if (tip.state === 'creating') { // Only move if there are enough funds
          return move(tip, user); // Next step
        } else {
          return tip.save(callback);
        }
      });
    });

    function move (tip, user) {
      var body = {
        method: 'move',
        params: [ user._id, '', tip.amount, 6, tip._id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.state = 'created'; // We did it
        tip.save(function (err, tip) {
          if (err) return callback(err);

          user.balance = user.balance - tip.amount; // perhaps use updatebalance?
          user.pending = user.pending + tip.amount;
          user.save(callback);
        }); // Done
      });
    }
  }

  ,

  // Must be called by queue
  resolve: function (user, tip, callback) {

    var is_tipper = _.find(user.accounts, function (account) {
      return account.provider === tip.tipper.provider && account.uniqid === tip.tipper.uniqid; // Get account corresponding to provider of current tip
    });

    var is_tippee = _.find(user.accounts, function (account) {
      return account.provider === tip.tippee.provider && account.uniqid === tip.tippee.uniqid; // Get account corresponding to provider of current tip
    });

    if (!tip) return callback(new Error('Not tip provided.'));

    if (!is_tippee && !is_tipper) return callback(new Error('Incorrect tip user.'));

    if (tip.state !== 'created') {
      return callback(new Error('Incorrect tip state.'));
    }

    // Check what kind of resolution this is
    var action;
    if (is_tipper) {
      action = 'cancel';
    }
    else if (is_tippee) {
      action = 'claim';
    }

    tip.state = action + 'ing';
    tip.resolved_id = new ObjectID(); // resolved_id identifies the tip later
    tip.save(function (err, tip) {
      if (err) return callback(err);
      return move(tip);
    });

    function move (tip) {
      var body = {
        method: 'move',
        params: [ '', user._id, tip.amount, 6, tip.resolved_id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.recipient_id = user._id;
        tip.state = action + 'ed'; // We did it

        tip.save(function (err) {
          if (err) return callback(err);
          user.balance = user.balance + tip.amount;
          user.pending = user.pending - tip.amount;
          user.save(function (err) {
            callback(err, tip, user);
          });
        });
      });
    }
  }
};


mongoose.model('Tip', TipSchema);