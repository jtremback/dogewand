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

  // use facebook strategy
  passport.use(new FacebookStrategy({
      clientID: config.facebook.clientID,
      clientSecret: config.facebook.clientSecret,
      callbackURL: config.url +  '/auth/facebook/callback',
      passReqToCallback: true
    }, function (req, accessToken, refreshToken, profile, done) {
      if (req.user) { // If they are signed in
        return req.user.linkAccount({
          username: profile.username,
          uuid: profile.id,
          provider: 'facebook'
        }, done);
      }
      User.upsert({ // If this is a new account
        provider: 'facebook',
        username: profile.username,
        uuid: profile.id
      }, done);
    }
  ));

  // use local strategy
  passport.use(new LocalStrategy(function(username, password, done) {
    User.findOne({ providers: { $elemMatch: { 'provider': 'dogewand', 'username': username } } }, function(err, user) {
      if (err) { return done(err); }
      if (!user) { return done(null, false, { message: 'Unknown username ' + username }); }
      user.authenticate(password, function(err, isMatch) {
        if (err) return done(err);
        if(isMatch) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Invalid password' });
        }
      });
    });
  }));
};
