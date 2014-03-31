'use strict';

var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');
var logic = require('./logic');


exports.createTip = function (req, res) {
  var opts = {
    username: req.params.username,
    provider: req.params.provider,
    amount: req.params.amount
  };

  logic.createTip(req.user, opts, function (err, tip, user) {
    if (err) {
      return res.render('error');
    }

    return res.render('tip-created', {
      tip: tip,
      opts: opts
    });
  });
};


exports.resolveTip = function (req, res, next) {
  var tip_id = req.tip_id;
  var user = req.user;

  Tip.resolve(user, tip_id, function (err, tip, user) {
    if (err) {
      return res.render('error');
    }

    return res.render('tip-resolved', {
      tip: tip,
      user: user
    });
  });
};