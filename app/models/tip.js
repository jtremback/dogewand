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
  tipper_id: { type: Schema.Types.ObjectId, ref: 'Account' },
  tippee_id: { type: Schema.Types.ObjectId, ref: 'Account' },
  recipient_id: { type: Schema.Types.ObjectId, ref: 'Account' },
  resolved_id: { type: Schema.Types.ObjectId } // stored in dogecoind 'comment' field
});



TipSchema.statics = {

  create: function (tipper, tippee, amount, callback) {
    var Self = this;

    tipper.updateBalance(function (err, tipper) {
      if (err) return callback(err);
      var balance = tipper.balance;

      if ((balance - amount) > 0) { // Check funds

        new Self({
          tipper_id: tipper._id,
          tippee_id: tippee._id,
          amount: amount,
          state: 'creating'
        }).save(function (err, tip) { // Create tip in db
          if (err) return callback(err);
          return move(tip, tipper); // Next step
        });
      }

      else return callback(402); // You are BROKE!
    });

    function move (tip, tipper) {
      var body = {
        method: 'move',
        params: [ tip.tipper_id, '', tip.amount, 6, tip._id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.state = 'created'; // We did it
        tipper.updateBalance(function (err, tipper) { // Update account with new balance
          if (err) return callback(err);
          tip.save(function (err, tip) {
            return callback(err, tip, tipper);
          }); // Done
        });
      });
    }
  }

  ,

  resolve: function (user, tip_id, callback) {
    var Self = this;

    Self.findOne({ _id: tip_id }, function (err, tip) {
      if (!tip) return callback(new Error('404 - Tip not found.'));

      var user_id = user._id.toString();
      var tipper_id = tip.tipper_id.toString();
      var tippee_id = tip.tippee_id.toString();

      if (tip.state === 'claimed') return callback(new Error('410 - Tip has already been claimed.'));
      if (tip.state === 'canceled') return callback(new Error('410 - Tip has been cancelled.'));
      if (tip.state !== 'created') return callback(new Error('410 - Tip is not redeemable.'));

      // Check what kind of resolution this is
      var action;
      if (user_id === tipper_id) {
        action = 'cancel';
      }
      else if (user_id === tippee_id) {
        action = 'claim';
      }
      else {
        return callback(new Error('401 - Account not allowed to access tip.'));
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

          tip.save(function (err, tip) {
            if (err) return callback(err);
            user.updateBalance(function (err, user) {
              callback(err, tip, user);
            });
          });
        });
      }
    });
  }
};

TipSchema.methods = {


};

mongoose.model('Tip', TipSchema);