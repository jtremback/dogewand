'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var check = require('check-types');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

exports.login = function (req, res) {
  if (req.user) return res.render('login', { user: req.user });
  return res.render('login');
};

exports.app = function (req, res) {
  res.render('app', {
    url: config.url
  });
};

exports.tipCreate = function (req, res, next) {
  var opts = {
    username: req.query.username,
    provider: req.query.provider
  };

  res.render('tip-create', {
    url: config.url,
    username: opts.username,
    provider: opts.provider
  });
};

exports.tip = function (req, res, next) {
  var path = req.params.tip;
  var path_matched = path.match(/(.*)doge\-(.*)/);
  var path_amount = path_matched[1];
  var tip_id = path_matched[2];

  Tip.findOne({_id: tip_id}, function (err, tip) {
    if (err) return next(err);

    if (path_amount !== tip.amount) return next('Tip not found.');

    res.render('tip', {
      url: config.url,
      user: req.user,
      tip: tip,
      path: path
    });
  });
};