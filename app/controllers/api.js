'use strict';

var db = require('../models/db.js');
var utils = require('../../utils.js');
var _ = require('lodash');

exports.authRedirect = function (req, res) {
  var redirect_to = req.session.redirect_to ? req.session.redirect_to : '/profile';
  delete req.session.redirect_to;
  return res.redirect(redirect_to);
};

exports.address = function (req, res, next) {
  db.getAddress(req.user.user_id, function (err, address) {
    if (err) return next(err);
    return res.json(new utils.SuccessResponse(address));
  });
};

exports.user = function (req, res) {
  return res.json(new utils.SuccessResponse(req.user));
};

exports.createTip = function (req, res, next) {
  var opts = {
    uniqid: [req.param('uniqid')],
    provider: req.param('provider'),
    display_name: req.param('display_name'),
    amount: Math.floor(req.param('amount')) // Coerce to int
  };

  db.createTip(req.user.user_id, req.param('account_id'), opts, function (err, new_balance, tip_id) {
    if (err && err.code === '23514') return next(new utils.NamedError('Not enough dogecoin.', 402));
    if (err) return next(err);

    db.getTip(tip_id, function (err, tip) {
      if (err) return next(err);
      return res.json(new utils.SuccessResponse({
        new_balance: new_balance,
        tip: tip
      }));
    });
  });
};

exports.getAccount = function (req, res, next) {
  db.getAccount(req.query.uniqid, req.query.provider, function (err, result) {
  console.log('err, result ' , err, result);
    if (err) { return next(err); }
    if (!result) return next(new utils.NamedError('Account not found.', 404));
    return res.json(new utils.SuccessResponse(_.omit(result, 'user_id', 'account_id', 'created_at')));
  });
};

exports.resolveTip = function (req, res, next) {
  db.resolveTip(req.param('tip_id'), req.user.user_id, function (err, new_balance) {
    if (err) return next(err);

    return res.json(new utils.SuccessResponse(new_balance));
  });
};

exports.checkUsername = function (req, res, next) {
  db.checkUsername(req.param.username, function (err, taken) {
    if (err) return next(err);

    return res.send(taken);
  });
};

exports.withdraw = function (req, res, next) {
  db.withdraw(req.user.user_id, {
    address: req.param('address'),
    amount: Math.floor(req.param('amount'))
  }, function (err, new_balance) {
    if (err) return next(err);
    return res.json(new utils.SuccessResponse({
      new_balance: new_balance
    }));
  });
};
