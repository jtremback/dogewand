'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var check = require('check-types');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');


exports.login = function (req, res) {
  if (req.user) return res.render('extension/modals/login', { user: req.user });
  return res.render('extension/modals/login');
};

exports.tip = function (req, res, next) {
  var path = req.params.tip;
  var path_matched = path.match(/(.*)doge\-(.*)/);
  var path_amount = path_matched[1];
  var tip_id = path_matched[2];

  Tip.findOne({_id: tip_id}, function (err, tip) {
    if (err) return next(err);

    if (path_amount !== tip.amount) return next('Tip not found.'); // Check to make sure the amount in the path is correct

    res.render('pages/tip', {
      url: config.url,
      user: req.user,
      tip: tip,
      path: path
    });
  });
};

exports.address = function (req, res, next) {
  Account.newAddress(function (err, address) {
    if (err) return next(err);
    res.render('extension/modals/address', {
      address: address,
      user: req.user
    });
  });
};

exports.toolbar = function (req, res) {
  res.render('extension/toolbar');
};

exports.withdraw = function (req, res, next) {

}