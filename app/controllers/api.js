'use strict';

var logic = require('./logic');

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

exports.user = function (req, res) {
  res.json(new SuccessResponse(req.user));
};

exports.createTip = function (req, res, next) {
  var opts = {
    uniqid: req.param('uniqid'),
    provider: req.param('provider'),
    name: req.param('name'),
    amount: parseInt(req.param('amount'), 10) // Coerce to int
  };

  logic.createTip(req.user, opts, function (err, user, tip) {
    if (err) return next(err);

    return res.json(new SuccessResponse({
      tip: tip,
      user: user
    }));
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
  req.user.updateBalance(function (err, user) {
    if (err) return next(err);
    res.json(new SuccessResponse({
      user: user
    }));
  });
};

exports.withdraw = function (req, res, next) {
  var amount = parseInt(req.param('amount'), 10);
  logic.withdraw(req.user, req.param('address'), amount, function (err, user) {
    if (err) return next(err);

    return res.json(new SuccessResponse({
      amount: amount,
      user: user,
      address: req.param('address')
    }));
  });
};
