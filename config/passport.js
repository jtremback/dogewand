'use strict';

var FacebookStrategy = require('passport-facebook').Strategy;
var RedditStrategy = require('passport-reddit').Strategy;
var YoutubeV3Strategy = require('passport-youtube-v3').Strategy;
var db = require('../app/models/db.js');

module.exports = function (passport, config) {

  // serialize sessions
  passport.serializeUser(function(user, done) {
    return done(null, user.user_id);
  });

  passport.deserializeUser(function(id, done) {
    db.getUser(id, function (err, user) {
      return done(err, user);
    });
  });


  function mergeOrAuth (req, opts, done) {
    db.auth(opts, function (err, user_id) {
      if (err) return done(err);
      db.getUser(user_id, function (err, auth_user) {
        if (err) return done(err);

        if (req.user && req.session.merge) {
          db.mergeUsers(auth_user.user_id, req.user.user_id, function () {
            if (err) return done(err);
            return done(err, auth_user);
          });
        }
        // Just auth normally
        else {
          return done(err, auth_user);
        }
      });
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
        uniqid: [ profile.id, profile.username ],
        provider: 'Facebook',
        display_name: profile.displayName
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
      mergeOrAuth(req, {
        provider: 'Youtube',
        display_name: profile._json.items[0].snippet.title,
        uniqid: [ profile._json.items[0].id ]
      }, done);
    }
  ));



  passport.use(new RedditStrategy({
      clientID: config.reddit.clientID,
      clientSecret: config.reddit.clientSecret,
      callbackURL: config.url +  '/auth/reddit/callback',
      passReqToCallback: true
    },
    function (req, accessToken, refreshToken, profile, done) {
      console.log('PROFILE', JSON.stringify(profile));
      mergeOrAuth(req, {
        uniqid: [ profile.name ],
        provider: 'Reddit',
        display_name: profile.name
      }, done);
    }
  ));
};
