'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var _ = require('lodash');
var Schema = mongoose.Schema;

var cryptos = require('../cryptos')(config.cryptos);


var TipSchema = new Schema({
  _id: String, // tx_id of original move to main
  amount: Number,
  claimed: String, // tx_id of corresponding wallet transaction
  canceled: String, // tx_id of corresponding wallet transaction
  to_wallet: String,
  from_wallet: String
});

// from_wallet, to_wallet, amount,

TipSchema.statics = {
  create: function (tip, callback) {
    var Self = this;

    transfer();

    function transfer() {
      var opts = _.cloneDeep(tip); // Clone to avoid modifying original
      opts.to_wallet = 'main'; // Put in main for escrow until claimed or canceled

      cryptos('move', opts, newTip);
    }

    function newTip (err, data, tx_id) {
      if (err) return callback(err);
      var doc = _.cloneDeep(tip);
      doc._id = tx_id; // So it can be indexed

      new Self(doc).save(callback);
    }
  }
};

TipSchema.methods = {

  claim: function (callback) {
    var self = this;

    if (self.claimed || self.canceled) return callback({type: 'inactive'}); // GTFO if the tip is gone already

    transfer();

    function transfer() {
      var opts = _.cloneDeep(self.toObject()); // Clone to get opts
      
      // Transform id name for cryptos
      opts.tx_id = opts._id;
      opts = _.omit(opts, '_id');
      opts.from_wallet = 'main'; // Get it out of escrow

      cryptos('move', opts, saveTip);
    }

    function saveTip (err, data, tx_id) {
      if (err) return callback(err);
      self.claimed = tx_id;
      self.save(function (err, tip) {
        if (err) return callback(err);
        callback(err, tip, data);
      });
    }
  }

  ,

  cancel: function (old_tx_id, callback) {
    var Self = this;

    findTip(old_tx_id); // Kickoff

    function findTip (tx_id) {
      Self.findOne({ _id: tx_id }, function (doc) {
        transfer(doc);
      });
    }

    function transfer(doc) {
      var saveTipReady = saveTip(doc); // Initialize callback with tip doc
      var opts = _.cloneDeep(doc.toObject()); // Clone to avoid modifying original
      
      // Reverse transaction
      opts.to_wallet = doc.from_wallet;
      opts.from_wallet = 'main';

      cryptos('move', opts, saveTipReady);
    }

    function saveTip (doc) {
      return function (err, data, tx_id) {
        console.log('saveTip', doc);
        if (err) return callback(err);
        doc.canceled = tx_id;
        doc.save(callback);
      };
    }
  }
};


mongoose.model('Tip', TipSchema);