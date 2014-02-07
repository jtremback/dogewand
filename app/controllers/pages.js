'use strict';

var mongoose = require('mongoose')
  , User = mongoose.model('User');

exports.login = function(req, res) {
  if (req.user) return res.render('hooray', { user: req.user });
  return res.render('login');
};