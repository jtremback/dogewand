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

// Catch both network and server errors on an rpc call
// function bothErrors (err, body)

// Check balance = from_balance
// from_balance = from_balance - amount
// if from_balance > 0, Move
// save(from_balance)

// from_wallet, to_wallet, amount,

TipSchema.statics = {

  create: function (opts, callback) {
    var Self = this;
    var doc = _.clone(opts);

    Account.findById(doc.from_wallet, function (err, wallet) {
      if (err) return callback(err);
      wallet.updateBalance(function (err, balance) {
        if (err) return callback(err);
        var new_balance = balance - doc.amount; // Get what balance would be after tip

        if (new_balance > 0) { // If it would be negative, forget it.
          doc.state = 'creating'; // Set state

          new Self(doc).save(function (err, tip) { // Create tip in db
            if (err) return callback(err);
            console.log(':) creating tip: ', tip);
            return move(tip); // Next step
          });
        }

        else return callback('insufficient');
      });
    });

    function move (tip) {
      var body = {
        method: 'move',
        params: [ tip.from_wallet, '', tip.amount, 6, tip._id ],
      };

      rpc(body, function (err, response) {
        if (err) return callback(err);

        tip.state = 'created'; // We did it
        console.log(':) moved funds: ', response);
        return tip.save(callback); // Done
      });
    }
  }

  ,

  list: function (where, sort, callback) {
    var Self = this;

    // Sanitize
    where = _.pick(where, ['state', 'from_wallet', 'to_wallet']);
    sort = _.pick(sort, ['_id', 'amount', 'resolved_id']);

    Self.find()
      .where(where)
      .sort(sort)
      .exec(function (err, tips) {
        return callback(err, tips);
      });
  }

};

TipSchema.methods = {

  resolve: function (operation, callback) {
    console.log(':) tip.resolve: ' + operation );

    // var self = this;
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

      rpc(body, function (err, response) {
        if (err) return callback(err);

        tip.state = operation + 'ed'; // We did it
        console.log(':) moved funds: ', response);
        Account.updateBalance(dest); // Update relevant account with new balance
        tip.save(callback);
      });
    }
  }

};

mongoose.model('Tip', TipSchema);