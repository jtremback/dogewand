'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var Schema = mongoose.Schema;
var DogeAPI = require('../src/index.js');
var dogeApi = new DogeAPI(config.dogeapi.creds);


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

    new Self({
      tipper_id: tipper._id,
      tippee_id: tippee._id,
      amount: amount,
      state: 'creating'
    }).save(function (err, tip) { // Create tip in db
      if (err) return callback(err);
      return move(tip, tipper); // Next step
    });

    function move (tip, tipper) {
      dogeApi.moveToUser('', tipper._id, tip.amount, function (err, txid) { // Move to main wallet
        if (err) return callback(err);

        tip.state = 'created'; // We did it
        tip.created_id = txid;
        tipper.updateBalance(function (err, tipper) { // Update account with new balance
          if (err) return callback(err);
          tip.save(function (err, tip) {
            return callback(err, tip, tipper, tippee);
          }); // Done
        });
      });
    }
  }

  ,

  resolve: function (tip_id, user, callback) {
    var Self = this;

    Self.findOne({ _id: tip_id }, function (err, tip) {
      if (!tip) return callback(new Error('Tip not found.'));

      if ((user_id !== tipper_id) || (user_id !== tippee_id)) return callback(new Error('This is not your tip.'));

      var user_id = user._id.toString();
      var tipper_id = tip.tipper_id.toString();
      var tippee_id = tip.tippee_id.toString();

      if (tip.state === 'claimed') return callback(new Error('Tip has already been claimed.'));
      if (tip.state === 'canceled') return callback(new Error('Tip has been cancelled.'));
      if (tip.state !== 'created') return callback(new Error('Tip error. Contact support.'));

      // Check what kind of resolution this is
      var action;
      if (user_id === tipper_id) {
        action = 'cancel';
      }
      else if (user_id === tippee_id) {
        action = 'claim';
      }
      else {
        return callback(new Error('This is not your tip.'));
      }

      tip.state = action + 'ing';
      tip.save(function (err, tip) {
        if (err) return callback(err);
        return move(tip);
      });

      function move (tip) {
        dogeApi.moveToUser(user._id, '', tip.amount, function (error, txid) { // Move to user from  main
          if (err) return callback(err);

          tip.recipient_id = user_id;
          tip.state = action + 'ed'; // We did it
          tip.resolved_id = txid;// resolved_id identifies the tip later
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


mongoose.model('Tip', TipSchema);
