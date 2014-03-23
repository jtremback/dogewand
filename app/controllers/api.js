'use strict';


var mongoose = require('mongoose');
var _ = require('lodash');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');
var check = require('check-types');

var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
};

exports.signin = function (req, res) {};

exports.authCallback = login;

exports.createTip = function (req, res, next) {
  var opts = {
    username: req.params.username,
    provider: req.params.provider,
    amount: req.params.amount
  };

  var valid = check.every(
    check.map(opts, {
      username: check.unemptyString,
      provider: check.unemptyString,
      amount: check.positiveNumber
    })
  );

  if (!valid) return next(new Error(400));

  createTip(req.user, opts, function (err, tip) {
    if (err) return next(err);
    return res.send(200, tip);
  });
};

function createTip (tipper, opts, callback) {
  if (opts.username === tipper.providers[0].username) callback(new Error('400 - You cannot tip yourself.'));
  Account.upsert({
    username: opts.username,
    provider: opts.provider
  }, function (err, tippee) {
    if (err) return callback(err);

    Tip.create(tipper, tippee, opts.amount, function (err, tip) {
      if (err) return callback(err);

      return callback(null, tip);
    });
  });
}


exports.resolveTip = function (req, res, next) {
  var tip_id = check.unemptyString(req.tip_id);
  var recipient = check.obj(req.user);
  if (!tip_id || !recipient) return next(400);

  resolveTip (recipient, tip_id, function (err, response) {
    if (err) return next(err);
    res.send(200, response);
  });
};

function resolveTip (recipient, tip_id, callback) {
  Tip.findOne({ _id: tip_id }, function (err, tip) {
    if (!tip) return callback(new Error('404 - Tip not found.'));

    tip.resolve(recipient, function (err, tip, recipient) {
      if (err) return callback(err);

      var response = {
        tip: tip,
        recipient: recipient
      };

      return callback(null, response);
    });
  });
}

exports.getAccount = function (req, res, next) {
  var account = req.user;

  getAccount(account, function (err, account) {
    if (err) return next(err);
    res.send(200, account);
  });
};

function getAccount (account, callback) {

}

exports.createTipTest = createTip;
exports.resolveTipTest = resolveTip;