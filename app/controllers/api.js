'use strict';

var mongoose = require('mongoose');
var logic = require('./logic');
var config = require('../../config/config')();
var check = require('check-types');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

exports.login = function (req, res) {
  if (req.user) return res.render('extension/modals/login', { user: req.user });
  return res.render('extension/modals/login');
};

exports.address = function (req, res, next) {
  Account.newAddress(function (err, address) {
    if (err) return next(err);
    res.render('extension/modals/address', {
      address: address,
      user: req.user
    });
  });
};

exports.account = function (req, res) {
  res.json(req.user);
};



exports.createTip = function (req, res, next) {
  var opts = {
    username: req.param('username'),
    provider: req.param('provider'),
    amount: parseInt(req.body.amount, 10) // Coerce to int
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
  var tip_id = req.tip_id;
  var account = req.user;

  logic.resolveTip(account, tip_id, function (err, new_balance) {
    if (err) return next(err);

    return res.json({
      new_balance: new_balance
    });
  });
};