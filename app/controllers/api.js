'use strict';

var mongoose = require('mongoose');
var logic = require('./logic');
var config = require('../../config/config')();
var check = require('check-types');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');


exports.address = function (req, res, next) {
  Account.newAddress(function (err, address) {
    if (err) return next(err);
    res.json({
      address: address
    });
  });
};

exports.account = function (req, res, next) {
  res.json(req.user);
};

exports.createTip = function (req, res, next) {
  var opts = {
    username: req.query.username,
    provider: req.query.provider,
    amount: parseInt(req.query.amount, 10) // Coerce to int
  };

  logic.createTip(req.user, opts, function (err, new_balance, tip_id) {
    if (err) return next(err);

    return res.json({
      tip_id: tip_id,
      new_balance: new_balance
    });
  });
};

exports.resolveTip = function (req, res, next) {
  logic.resolveTip(req.user, req.query.tip_id, function (err, new_balance) {
    if (err) return next(err);

    return res.json({
      new_balance: new_balance
    });
  });
};