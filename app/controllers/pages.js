'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var check = require('check-types');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

exports.tip = function (req, res, next) {
  var path = req.params.tip;
  var path_matched = path.match(/(.*)doge\-(.*)/);

  if (!path_matched) return next('Invalid tip ID.');

  var path_amount = path_matched[1];
  var tip_id = path_matched[2];

  Tip.findOne({_id: tip_id}, function (err, tip) {
    if (err) return next(err);
    if (!tip) {
      return res.send('Tip not found.');
    }
    if (path_amount !== tip.amount) return next('Tip not found.'); // Check to make sure the amount in the path is correct

    return res.render('/tip', {
      url: config.url,
      user: req.user,
      tip: tip,
      path: path
    });
  });
};