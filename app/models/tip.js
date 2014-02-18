'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var _ = require('lodash');
var Schema = mongoose.Schema;
var ObjectID = require('mongodb').ObjectID;

var cryptos = require('../cryptos')(config.cryptos);


var TipSchema = new Schema({
  amount: Number,
  state: String, // In case of accidents
  resolve_id: String, // tx_id of corresponding wallet transaction
  from_wallet: String,
  from_wallet_balance: Number, // Set when tip is created, updated when canceled.
  to_wallet: String,
  to_wallet_balance: Number // Set when tip is claimed, not when canceled.
});

// from_wallet, to_wallet, amount,

TipSchema.statics = {

  create: function (opts, callback) {
    var Self = this;
    console.log(':) Tip.create()');

    createTip();
    function createTip () {
      var doc = _.clone(opts);
      doc.state = 'creating';
      new Self(doc).save(function (err, tip) {
        if (err) return callback(err);
        console.log(':) creating tip: ', tip);

        transfer(tip);
      });
    }

    function transfer (tip) {
      var opts = _.pick(tip, 'from_wallet', 'amount'); // Clone only those opts we need
      opts.tx_id = tip._id + '00000000'; // Create tx_id as padded oid
      opts.to_wallet = 'main'; // Put in main for escrow until claimed or canceled

      var saveTipReady = saveTip(tip); // Load tip into saveTip scope - see below
      cryptos('move', opts, saveTipReady);
    }

    // Double wrapped function that can be preloaded with a tip and then passed into cryptos
    function saveTip (tip) {
      return function (err, response) {
        if (err) return callback(err);
        console.log(':) moved funds: ', response);

        tip.state = 'created';
        tip.from_wallet_balance = response.data[tip.from_wallet][config.cryptos.coin]; // Get balance out of api format

        tip.save(function (err, tip) {
          if (err) return callback(err);
          console.log(':) created tip');

          callback(err, tip, response);
        });
      };
    }
  }

  ,

  list: function (where, sort, callback) {
    var Self = this;

    // Sanitize
    where = _.pick(where, ['state', 'from_wallet', 'to_wallet']);
    sort = _.pick(sort, ['_id', 'amount', 'resolve_id']);

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
    var self = this;

    if (operation !== 'claim' && operation !== 'cancel')
      return callback({type: 'operation'}); // Can not compute

    if (self.state !== 'created') 
      return callback({type: 'inactive'}); // Sorry, all gone

    start();

    // Mostly just sets the state to whichever operation is happening (canceling, claiming), 
    // so we can fix transaction problems when they happen
    function start () {
      self.state = operation + 'ing';
      self.resolve_id = new ObjectID() + '00000000'; // Keep the tx_id. We need to pad it for cryptos, which is dumb
      self.save(function (err) {
        if (err) return callback(err);
        transfer();
      });
    }

    // Move the funds (with switches for operation)
    function transfer () {
      var opts = _.pick(self.toObject(), ['to_wallet', 'amount']); // Clone only those opts we need
      
      opts.tx_id = self.resolve_id; // Transform id name for cryptos
      opts.from_wallet = 'main'; // Get it out of escrow

      if (operation === 'cancel') opts.to_wallet = self.from_wallet; // Reverse transaction

      cryptos('move', opts, saveTip);
    }

    // Confirm it
    function saveTip (err, response) {
      if (err) return callback(err);
      self.state = operation + 'ed';

      if (operation === 'claim')
        self.to_wallet_balance = response.data[self.to_wallet][config.cryptos.coin];

      if (operation === 'cancel')
        self.from_wallet_balance = response.data[self.from_wallet][config.cryptos.coin]; // Reverse transaction

      self.save(function (err, tip) {
        if (err) return callback(err);
        callback(err, tip, response);
      });
    }
  }

};

mongoose.model('Tip', TipSchema);