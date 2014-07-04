'use strict';

var config = require('../../config/config')();
var _ = require('lodash');
var db = require('../models/db');

exports.tip = function (req, res, next) {
  var tip_path = req.params.tip;
  var path_matched = tip_path.match(/(.*)doge\-(.*)/);

  if (!path_matched) return next('Invalid tip ID.');

  var path_amount = path_matched[1];
  var tip_id = path_matched[2];

  db.getTip(tip_id, function (err, tip) {
    if (err) return next(err);
    if (!tip) {
      return res.send('Tip not found.');
    }
    if (path_amount != tip.amount) return res.send('Tip not found.');

    var role = false;

    if (req.user) {
      var is_tipper = _.find(req.user.accounts, function (account) {
        return account.account_id === tip.tipper.account_id; // Get account corresponding to provider of current tip
      });

      var is_tippee = _.find(req.user.accounts, function (account) {
        return account.account_id === tip.tippee.account_id; // Get account corresponding to provider of current tip
      });

      if (is_tippee) {
        role = 'tippee';
      }
      else if (is_tipper) {
        role = 'tipper';
      }
    }

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

  db.resolveTip(req.user, tip_id, function (err) {
    if (err) return next(err);
    return res.redirect('/profile');
  });
};

exports.profile = function (req, res) {
  return res.render('profile.jade', {
    user: req.user,
    bookmarklet: require('../../loader/bookmarklet/bookmarklet.js'),
    version: config.bookmarklet_version
  });
};

exports.withdraw = function (req, res, next) {
  var amount = Math.floor(req.param('amount'));
  db.withdraw(req.user.user_id, {
    address: req.param('address'),
    amount: amount
  }, function (err) {
    if (err) return next(err);
    return res.redirect('/profile');
  });
};

exports.iframe = function (req, res) {
  return res.render('iframe.jade', {
    bookmarklet: require('../../loader/bookmarklet/bookmarklet.js'),
    version: config.bookmarklet_version
  });
};