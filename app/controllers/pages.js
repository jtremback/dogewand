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

    var role = false;

    if (req.user) {
      var is_tipper = _.find(req.user.accounts, function (account) {
        return account.provider === tip.tipper.provider && account.uniqid === tip.tipper.uniqid; // Get account corresponding to provider of current tip
      });

      var is_tippee = _.find(req.user.accounts, function (account) {
        return account.provider === tip.tippee.provider && account.uniqid === tip.tippee.uniqid; // Get account corresponding to provider of current tip
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

  logic.resolveTip(req.user, tip_id, function (err) {
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
  var amount = parseInt(req.param('amount'), 10);
  logic.withdraw(req.user, req.param('address'), amount, function (err) {
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