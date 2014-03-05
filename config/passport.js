'use strict';

var mongoose = require('mongoose');
var FacebookStrategy = require('passport-facebook').Strategy;
var Account = mongoose.model('Account');


module.exports = function (passport, config) {

  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    Account.findOne({ _id: id }, function (err, account) {
      done(err, account);
    });
  });

  // use facebook strategy
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.url +  '/auth/facebook/callback'
    }, function (accessToken, refreshToken, profile, done) {
      Account.upsert({
        'providers.provider': 'facebook',
        'providers.username': profile.username
      }, done);
    }
  ));
};
