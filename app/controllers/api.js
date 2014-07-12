'use strict';

var db = require('../models/db.js');
var utils = require('../../utils.js');

function SuccessResponse (data) {
  return {
    status: 200,
    error: false,
    data: data
  };
}

exports.authRedirect = function (req, res) {
  var redirect_to = req.session.redirect ? req.session.redirect : '/profile';
  delete req.session.redirect;
  return res.redirect(redirect_to);
};

exports.address = function (req, res, next) {
  db.getAddress(req.user.user_id, function (err, address) {
    if (err) return next(err);
    return res.json(new SuccessResponse(address));
  });
};

exports.user = function (req, res) {
  return res.json(new SuccessResponse(req.user));
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
      return res.json(new SuccessResponse({
        new_balance: new_balance,
        tip: tip
      }));
    });
  });
};

exports.resolveTip = function (req, res, next) {
  db.resolveTip(req.param('tip_id'), req.user.user_id, function (err, new_balance) {
    if (err) return next(err);

    return res.json(new SuccessResponse(new_balance));
  });
};

exports.withdraw = function (req, res, next) {
  db.withdraw(req.user.user_id, {
    address: req.param('address'),
    amount: Math.floor(req.param('amount'))
  }, function (err, new_balance) {
    if (err) return next(err);
    return res.json(new SuccessResponse({
      new_balance: new_balance
    }));
  });
};
