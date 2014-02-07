'use strict';


var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
};

exports.signin = function (req, res) {};

/**
 * Auth callback
 */

exports.authCallback = login;


exports.generateTip = function (req, res) {
  var identifier = req.params.identifier;
  var provider = req.params.provider;
  var amount = req.params.amount;
  var tipper = req.user;

  Account.upsert(identifier, provider, function (err, tippee) {
    if (err) return console.error(err);
    wallets.move(tipper.wallet_id, tippee.wallet_id, amount, function (err) {
      if (err) return console.error(err); // TODO handle error with response
      Tip.create(tipper.wallet_id, tippee.wallet_id, amount, function (err, tip) {
        if (err) return console.error(err); // TODO handle error with response
        res.send({
          link: url + tip.hash
        })
      });
    });
  });
};