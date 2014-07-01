'use strict';

var db = require('../models/db.js');

function SuccessResponse (data) {
  return {
    status: 200,
    error: false,
    data: data
  };
}


exports.address = function (req, res, next) {
  db.getAddress(req.user.user_id, function (err, address) {
    if (err) return next(err);
    res.json(new SuccessResponse(address));
  });
};

exports.user = function (req, res) {
  res.json(new SuccessResponse(req.user));
};

exports.createTip = function (req, res, next) {
  var opts = {
    uniqid: req.param('uniqid'),
    provider: req.param('provider'),
    display_name: req.param('display_name'),
    amount: Math.floor(req.param('amount')) // Coerce to int
  };

  db.createTip(req.user.user_id, req.param('account_id'), opts, function (err, new_balance, tip_id) {
    if (err) return next(err);
    res.json(new SuccessResponse({
      new_balance: new_balance,
      tip_id: tip_id
    }));
  });
};

exports.resolveTip = function (req, res, next) {
  db.resolveTip(req.param('tip_id'), req.user.user_id, function (err, new_balance) {
    if (err) return next(err);

    return res.json(new SuccessResponse(new_balance));
  });
};

exports.withdraw = function (req, res, next) {
  db.withdraw(req.user, {
    address: req.param('address'),
    amount: Math.floor(req.param('amount'))
  }, function (err, new_balance) {
    if (err) return next(err);
    return res.json(new SuccessResponse({
      new_balance: new_balance
    }));
  });
};
