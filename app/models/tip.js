'use strict';

var mongoose = require('mongoose');
// var Account = mongoose.model('Account');
var config = require('../../config/config')();
// var _ = require('lodash');
var Schema = mongoose.Schema;
var ObjectID = require('mongodb').ObjectID;

var rpc = require('../rpc')(config.rpc);


var TipSchema = new Schema({
  amount: Number,
  state: String,
  tipper_id: { type: Schema.Types.ObjectId, ref: 'Account' },
  tippee_id: { type: Schema.Types.ObjectId, ref: 'Account' },
  recipient_id: { type: Schema.Types.ObjectId, ref: 'Account' },
  resolved_id: { type: Schema.Types.ObjectId } // stored in dogecoind 'comment' field
});



TipSchema.statics = {

  create: function (tipper, tippee, amount, tip_id, callback) {
    var Self = this;

    tipper.updateBalance(function (err, tipper) {
      if (err) return callback(err);
      var balance = tipper.balance;

      console.log(Date.now(), 'TIP CREATE TIPPER BALANCE', tipper.balance, tippee.username)

      var tip = new Self({
        _id: tip_id,
        tipper_id: tipper._id,
        tippee_id: tippee._id,
        amount: amount,
      });


      if ((balance - amount) >= 0) { // Check funds
        tip.state = 'creating';
      }

      else { // If insufficient funds
        tip.state = 'insufficient';
      }

      tip.save(function (err, tip) { // Create tip in db
        if (err) return callback(err);
        if (tip.state === 'creating') { // Only move if there are enough funds
          return move(tip, tipper); // Next step
        } else {
          return tip.save(callback);
          // return callback(new Error(402));
        }
      });


    });

    function move (tip, tipper) {
      var body = {
        method: 'move',
        params: [ tip.tipper_id, '', tip.amount, 6, tip._id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.state = 'created'; // We did it
        tipper.updateBalance(function (err) { // Update account with new balance
          if (err) return callback(err);
          tip.save(function (err, tip) {
            if (err) return callback(err);
            console.log(Date.now(), 'TIP SAVE', tip)
            return callback(null, tip);
          }); // Done
        });
      });
    }
  }

  ,

  resolve: function (tip, account, callback) {
    var Self = this;

    if (!tip) return callback(new Error('Not tip provided.'));

    var account_id = account._id.toString();
    var tipper_id = tip.tipper_id.toString();
    var tippee_id = tip.tippee_id.toString();

    if ((account_id !== tipper_id) && (account_id !== tippee_id)) return callback(new Error('Incorrect tip account.'));

    if (tip.state === 'claimed' || tip.state === 'canceled' || tip.state !== 'created') {
      return callback(new Error('Incorrect tip state.'));
    }

    // Check what kind of resolution this is
    var action;
    if (account_id === tipper_id) {
      action = 'cancel';
    }
    else if (account_id === tippee_id) {
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
        params: [ '', account_id, tip.amount, 6, tip.resolved_id ],
      };

      rpc(body, function (err) {
        if (err) return callback(err);

        tip.recipient_id = account_id;
        tip.state = action + 'ed'; // We did it

        tip.save(function (err) {
          if (err) return callback(err);
          account.updateBalance(function (err) {
            callback(err, tip, account);
          });
        });
      });
    }
  }
};


mongoose.model('Tip', TipSchema);