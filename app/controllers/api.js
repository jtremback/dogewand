'use strict';

var db = require('../db.js');
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
    display_name: req.param('display_name'),
    amount: parseInt(req.param('amount'), 10) // Coerce to int
  };

  db.createTip(req.user.user_id, req.param('account_id'), opts, function (err, result) {
    if (err) return next(err);
    res.json(new SuccessResponse(result));
  });
};

exports.resolveTip = function (req, res, next) {
  db.resolveTip(req.param('tip_id'), req.user.user_id, function (err, result) {
    if (err) return next(err);

    return res.json(new SuccessResponse(result));
  });
};
// DLKmSAjmrB7f4udVu8GV1dgA4vbspFjMvo
// exports.updateBalance = function (req, res, next) {
//   req.user.updateBalance(function (err, user) {
//     if (err) return next(err);
//     res.json(new SuccessResponse({
//       user: user
//     }));
//   });
// };

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
