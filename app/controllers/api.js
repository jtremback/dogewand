'use strict';


var mongoose = require('mongoose');
var _ = require('lodash');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
};

exports.signin = function (req, res) {};

exports.authCallback = login;

exports.generateTip = function (req, res) {
  var tipper = req.user;

  var opts = {
    username: req.params.username,
    provider: req.params.provider
  };

  Account.upsert(opts, function (err, tippee) { // Get or make account for tippee
    if (err) return console.error(err);

    var opts = {
      from_wallet: tipper.wallet_id,
      to_wallet: tippee.wallet_id,
      amount: req.params.amount
    };

    Tip.create(opts, function (err, tip) {
      if (err) return res.send(500, 'Internal Error');

      var response = _.pick(tip, ['from_wallet', 'to_wallet', 'from_wallet_balance', '_id']);
      return res.send(200, response);
    });
  });
};

exports.resolveTip = function (req, res) {
  var id = req.params.id;
  var operation = req.params.operation;

  Tip.findById(id, function (err, tip) {
    if (err) return res.send(500, 'Internal Error');
    if (!tip) return res.send(404, 'Tip not found');

    tip.resolve(operation, function (err, tip) {
      if (err) return res.send(500, 'Internal Error');
      var response;

      if (operation === 'claim') {
        response = _.pick(tip, ['from_wallet', 'to_wallet', 'to_wallet_balance', '_id']);
      }

      if (operation === 'cancel') {
        response = _.pick(tip, ['from_wallet', 'to_wallet', 'from_wallet_balance', '_id']);
      }

      return res.send(200, response);
    });
  });
};
