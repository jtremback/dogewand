'use strict';

var mongoose = require('mongoose');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
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
      callbackURL: config.url +  '/auth/facebook/callback',
      passReqToCallback: true
    }, function (req, accessToken, refreshToken, profile, done) {
      if(req.user) {
        req.user.linkAccount(profile.displayName, 'facebook');
        return done(null, req.user);
      } 
      Account.upsert({
        provider: 'facebook',
        username: profile.username
      }, done);
    }
  ));

  // use local strategy
  passport.use(new LocalStrategy(function(username, password, done) {
    Account.findOne({ providers: { $elemMatch: { 'provider': 'dogewand', 'username': username } } }, function(err, account) {
      if (err) { return done(err); }
      if (!account) { return done(null, false, { message: 'Unknown username ' + username }); }
      account.authenticate(password, function(err, isMatch) {
        if (err) return done(err);
        if(isMatch) {
          return done(null, account);
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      });
    });
  }));
};
