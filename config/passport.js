'use strict';

var mongoose = require('mongoose');
var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var YoutubeV3Strategy = require('passport-youtube-v3').Strategy;
var User = mongoose.model('User');
var queue = require('../app/models/queue.js');

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


  function mergeOrAuth (req, opts, done) {
    User.upsert(opts, function (err, auth_user) {
      console.log('LOLOLOLOLOLOLOLLO', req.session)
      if (err) return done(err);
      // Here, auth_user basically represents an account on the provider that the user has just clicked on.
      // so 'mergeFrom' gets the account info from the clicked provider and merges into the currently signed in acct.
      // user stays signed into current account
      if (req.user && req.session.merge === 'from') {
        queue.pushCommand('User', 'mergeUsers', [ auth_user, req.user ]);
        done(err, req.user);
      }
      // mergeTo gets the acct. info from the currently signed in user and merges it into the clicked acct.
      // user becomes signed into clicked acct.
      if (req.user && req.session.merge === 'to') {
        queue.pushCommand('User', 'mergeUsers', [ req.user, auth_user ]);
        done(err, auth_user);
      }
      // Just auth normally
      else {
        done(err, auth_user);
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
      mergeOrAuth(req, {
        provider: 'Facebook',
        name: profile.displayName,
        uniqid: profile.id
      }, done);
    }
  ));



  passport.use(new YoutubeV3Strategy({
    clientID: config.youtube.clientID,
    clientSecret: config.youtube.clientSecret,
    callbackURL: config.url +  '/auth/youtube/callback',
    scope: ['https://www.googleapis.com/auth/youtube.readonly'],
    passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
      console.log('PROFILE', JSON.stringify(profile));
      mergeOrAuth(req, {
        provider: 'Youtube',
        name: profile._json.items[0].snippet.title,
        uniqid: profile._json.items[0].id
      }, done);
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
