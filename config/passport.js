'use strict';

var mongoose = require('mongoose')
  , FacebookStrategy = require('passport-facebook').Strategy
  , User = mongoose.model('User')
  , randomString = require('randomstring')
  , urlTools = require('url-tools')
;


function urlSanitize (url_str) {
  var options = {
    lowercase: true,
    removeWWW: true,
    removeTrailingSlash: true,
    forceTrailingSlash: false,
    removeSearch: false,
    removeHash: true,
    removeHashbang: true,
    removeProtocol: true
  };

  return urlTools.normalize(url_str, options);
}


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
      callbackURL: config.url +  '/auth/facebook/callback'
    },
    function (accessToken, refreshToken, profile, done) {
      //Sanitize profile url for foolproofing
      var sani_url = urlSanitize(profile.profileUrl);
      User.findOne({ 'sani_url': sani_url }, function (err, user) {
        if (err) { return done(err); }
        if (!user) {
          user = new User({
            username: profile.username,
            wallet_id: 'foohammer',
            sani_url: sani_url,
            provider: 'facebook',
            facebook: profile
          });
          user.save(function (err) {
            if (err) console.log(err);
            return done(err, user);
          });
        }
        else {
          return done(err, user);
        }
      });
    }
  ));
};
