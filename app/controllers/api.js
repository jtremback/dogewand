'use strict';


var mongoose = require('mongoose')
  , User = mongoose.model('User');

var login = function (req, res) {
  var redirectTo = req.session.returnTo ? req.session.returnTo : '/';
  delete req.session.returnTo;
  res.redirect(redirectTo);
}

exports.signin = function (req, res) {}

/**
 * Auth callback
 */

exports.authCallback = login


// api/:profile_link/:amount

exports.tip = function (req, res) {
  var profile_link = User.profileLinkSanitize(req.params.profile_link);

  User.findOne({ 'sani_url':  }, function (err, user) {
    
  }
}
