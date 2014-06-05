'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var logic = require('./logic.js');
var Tip = mongoose.model('Tip');
var _ = require('lodash');

exports.tip = function (req, res, next) {
  var tip_path = req.params.tip;
  var path_matched = tip_path.match(/(.*)doge\-(.*)/);

  if (!path_matched) return next('Invalid tip ID.');

  var path_amount = path_matched[1];
  var tip_id = path_matched[2];


  Tip.findOne({_id: tip_id})
  .exec(function (err, tip) {
    if (err) return next(err);
    if (!tip) {
      return res.send('Tip not found.');
    }

    if (path_amount != tip.amount) return res.send('Tip not found.'); // Check to make sure the amount in the path is correct

    var role;

    var is_tipper = _.find(req.user.accounts, function (account) {
      return account.provider === tip.tipper.provider && account.uniqid === tip.tipper.uniqid; // Get account corresponding to provider of current tip
    });

    var is_tippee = _.find(req.user.accounts, function (account) {
      return account.provider === tip.tippee.provider && account.uniqid === tip.tippee.uniqid; // Get account corresponding to provider of current tip
    });

    if (!req.user) role = false;
    else if (is_tippee) role = 'tippee';
    else if (is_tipper) role = 'tipper';
    else role = false;

    return res.render('tip.jade', {
      url: config.url,
      user: req.user,
      role: role,
      tip: tip,
      tip_path: tip_path
    });
  });
};

exports.resolveTip = function (req, res, next) {
  var tip = req.params.tip;
  var tip_id = tip.substr(tip.length - 24);

  logic.resolveTip(req.user, tip_id, function (err, user, tip) {
    if (err) return next(err);

    return res.render('tip-resolved.jade', {
      user: user,
      tip: tip
    });
  });
};