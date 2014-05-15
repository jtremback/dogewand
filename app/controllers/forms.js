'use strict';

var logic = require('./logic');

exports.createTip = function (req, res, next) {
  var opts = {
    username: req.param('username'),
    provider: req.param('provider'),
    amount: parseInt(req.body.amount, 10) // Coerce to int
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
  var tip_id = req.tip_id;
  var user = req.user;

  logic.resolveTip(user, tip_id, function (err, tip, user) {
    if (err) return next(err);

    return res.render('pages/tip-resolved', {
      tip: tip,
      user: user
    });
  });
};