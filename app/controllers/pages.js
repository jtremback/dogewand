'use strict';

var config = require('../../config/config')();
var check = require('check-types');

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

  var valid = check.every(
    check.map(opts, {
      username: check.unemptyString,
      provider: check.unemptyString
    })
  );

  if (!valid) return next(new Error(400));

  res.render('tip-create', {
    url: config.url,
    username: opts.username,
    provider: opts.provider
  });
};
