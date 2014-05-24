'use strict';

var mongoose = require('mongoose');
var logic = require('./logic');
var config = require('../../config/config')();
var check = require('check-types');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

function SuccessResponse (data) {
  return {
    status: 200,
    error: false,
    data: data
  };
}


exports.address = function (req, res, next) {
  req.user.getAddress(function (err, address) {
    if (err) return next(err);

    res.json(new SuccessResponse(address));
  });
};

exports.account = function (req, res, next) {
  res.json(new SuccessResponse(req.user));
};

exports.createTip = function (req, res, next) {
  var opts = {
    username: req.param('username'),
    provider: req.param('provider'),
    amount: parseInt(req.param('amount'), 10) // Coerce to int
  };

  logic.createTip(req.user, opts, function (err, account, tip_id) {
    if (err) return next(err);

    return res.json({
      tip_id: tip_id,
      amount: opts.amount,
      account: account
    });
  });
};

exports.resolveTip = function (req, res, next) {
  logic.resolveTip(req.param('tip_id'), req.user, function (err, new_balance) {
    if (err) return next(err);

    return res.json({
      new_balance: new_balance
    });
  });
};

exports.updateBalance = function (req, res, next) {
  req.user.updateBalance(function (err, account) {
    if (err) return next(err);
    res.json(account.balance);
  });
};

exports.withdraw = function (next) {
  logic.withdraw(req.user.id, req.query.address, req.query.amount, function (err, new_balance) {
    if (err) return next(err);

    return res.json({
      new_balance: new_balance
    });
  });
};
