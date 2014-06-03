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
    amount: parseInt(req.param('amount'), 10) // Coerce to int
  };

  logic.createTip(req.user, opts, function (err, user, tip_id) {
    if (err) return next(err);

    return res.json({
      tip_id: tip_id,
      amount: opts.amount,
      user: user
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
  req.user.updateBalance(function (err, user) {
    if (err) return next(err);
    res.json(user.balance);
  });
};

exports.withdraw = function (req, res, next) {
  logic.withdraw(req.user.id, req.param('address'), req.param('amount'), function (err, new_balance) {
    if (err) return next(err);

    return res.json({
      new_balance: new_balance
    });
  });
};
