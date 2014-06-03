'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var logic = require('./logic.js');
var Tip = mongoose.model('Tip');

exports.tip = function (req, res, next) {
  var tip_path = req.params.tip;
  var path_matched = tip_path.match(/(.*)doge\-(.*)/);

  if (!path_matched) return next('Invalid tip ID.');

  var path_amount = path_matched[1];
  var tip_id = path_matched[2];


  Tip.findOne({_id: tip_id})
  .populate('tipper_id', 'username provider')
  .populate('tippee_id', 'username provider')
  .exec(function (err, tip) {
    if (err) return next(err);
    if (!tip) {
      return res.send('Tip not found.');
    }

    if (path_amount != tip.amount) return res.send('Tip not found.'); // Check to make sure the amount in the path is correct

    var role;

    if (!req.user) role = false;
    else if (req.user.id === tip.tippee_id.id) role = 'tippee';
    else if (req.user.id === tip.tipper_id.id) role = 'tipper';
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

  logic.resolveTip(tip_id, req.user, function (err, new_balance) {
    if (err) return next(err);

    return res.redirect
  });
};