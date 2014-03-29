'use strict';

var config = require('../../config/config')();

exports.login = function (req, res) {
  if (req.user) return res.render('login', { user: req.user });
  return res.render('login');
};

exports.app = function (req, res) {
  res.render('app', {
    url: config.url
  });
};

exports.tipper = function (req, res) {
  res.render('tipper', {
    url: config.url
  });
};