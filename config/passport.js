'use strict';

var FacebookStrategy = require('passport-facebook').Strategy;
var LocalStrategy = require('passport-local').Strategy;
var YoutubeV3Strategy = require('passport-youtube-v3').Strategy;
var db = require('../app/models/db.js');

module.exports = function (passport, config) {

  // serialize sessions
  passport.serializeUser(function(user, done) {
    console.log('serializeuser', user)
    done(null, user.user_id);
  });

  passport.deserializeUser(function(id, done) {
    console.log('deserializeuser', id)
    db.getUser(id, function (err, user) {
      done(err, user);
    });
  });


  function mergeOrAuth (req, opts, done) {
    db.auth(opts, function (err, user_id) {
      if (err) return done(err);
      db.getUser(user_id, function (err, auth_user) {
        if (err) return done(err);
        // Here, auth_user basically represents an account on the provider that the user has just clicked on.
        // so 'mergeFrom' gets the account info from the clicked provider and merges into the currently signed in acct.
        // user stays signed into current account
        if (req.user && req.session.merge === 'from') {
          db.mergeUsers(req.user, auth_user, function () {
            if (err) return done(err);
            done(err, req.user);
          });
        }
        // mergeTo gets the acct. info from the currently signed in user and merges it into the clicked acct.
        // user becomes signed into clicked acct. (Do we really want this?????)
        if (req.user && req.session.merge === 'to') {
          db.mergeUsers(auth_user, req.user, function () {
            if (err) return done(err);
            done(err, auth_user);
          });
        }
        // Just auth normally
        else {
          done(err, auth_user);
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
        uniqid: profile.id,
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
      console.log('PROFILE', JSON.stringify(profile));
      mergeOrAuth(req, {
        provider: 'Youtube',
        name: profile._json.items[0].snippet.title,
        uniqid: profile._json.items[0].id
      }, done);
    }
  ));



  // // use local strategy
  // passport.use(new LocalStrategy(function(uniqid, password, done) {
  //   User.upsert({
  //     provider: 'dogewand',
  //     uniqid: uniqid
  //   }, function (err, user) {
  //     if (err) { return done(err); }
  //     user.authenticate(password, function(err, isMatch) {
  //       if (err) return done(err);
  //       if (isMatch) {
  //         return done(null, user);
  //       } else {
  //         return done(null, false, { message: 'Invalid password' });
  //       }
  //     });
  //   });
  // }));
};
