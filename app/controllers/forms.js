'use strict';

var logic = require('./logic');

exports.createTip = function (req, res, next) {
  var opts = {
    username: req.param('username'),
    provider: req.param('provider'),
    amount: Math.floor(req.body.amount) // Coerce to int
  };

  logic.createTip(req.user, opts, function (err, tip, tipper, tippee) {
    if (err) return next(err);

    return res.render('/tip-created', {
      tip: tip,
      tipper: tipper,
      tippee: tippee
    });
  });
};


exports.resolveTip = function (req, res, next) {
  logic.resolveTip(req.user.user_id, req.tip_id, function (err, new_balance, tip_id) {
    if (err) return next(err);

    return res.render('pages/tip-resolved', {
      tip: tip_id,
      new_balance: new_balance
    });
  });
};