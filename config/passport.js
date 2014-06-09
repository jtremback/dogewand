'use strict';

var mongoose = require('mongoose');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var User = mongoose.model('User');

module.exports = function (passport, config) {

  // serialize sessions
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function(id, done) {
    User.findOne({ _id: id }, function (err, user) {
      done(err, user);
    });
  });


  function mergeOrAuth (req, provider, profile, done) {
    User.upsert({
      provider: provider,
      name: profile.displayName,
      uniqid: profile.id
    }, function (err, from_user) {
      if (err) return done(err);
      // Here, from_user basically represents an account on the provider that the user has just clicked on.
      // so 'mergeFrom' gets the account from this provider.
      if (req.user && req.params('mergeFrom')) { // If they are signed in and wish to link accts.
        return User.mergeUsers(from_user, req.user, done);
      }
      if (req.user && req.params('mergeTo')) { // If they are signed in and wish to link accts.
        return User.mergeUsers(req.user, from_user, done);
      }
      else {
        done(err, from_user);
      }
    });
  }

  // use facebook strategy
  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
      callbackURL: config.url +  '/auth/facebook/callback',
      passReqToCallback: true
    }, function (req, accessToken, refreshToken, profile, done) {
      mergeOrAuth(req, 'Facebook', profile, done);
    }
  ));

  // use local strategy
  passport.use(new LocalStrategy(function(uniqid, password, done) {
    User.upsert({
      provider: 'dogewand',
      uniqid: uniqid
    }, function (err, user) {
      if (err) { return done(err); }
      user.authenticate(password, function(err, isMatch) {
        if (err) return done(err);
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      });
    });
  }));
};
