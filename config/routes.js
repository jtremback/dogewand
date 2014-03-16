'use strict';

var api = require('../app/controllers/api'),
  pages = require('../app/controllers/pages')
;

// get api
//   smoke test

// get api/user
//   current logged in user data

// get api/user/tips
//   get current user's tips

// post api/tip/create_tip
//   create tip

// post api/tip/claim_tip
//   claim tip

// post api/tip/cancel_tip
//   cancel tip



// get /
//   view landing page

// get tip/:_id
//   view tip page

// get account
//   view account of signed in user

// get extension/* 
//   pages formatted for an iframe in the extension

// get extension/login
//   login with x button


module.exports = function (app, passport) {

  // app.get('/', function(req, res){
  //   // front page
  // });

  // Smoke test
  app.get('/api', function (req, res) {
    console.log(req);
    res.status(200).send('200 OK');
  });


  // app.get('/api/v1/user', api.userInfo);

  // // 
  // app.get('/api/v1/user/tips', api.userTips);

  // app.post('/api/v1/tip/create', api.createTip);

  // app.post('/api/v1/tip/claim_tip', api.resolveTip);

  // // app.get('/api/tip/cancel_tip', function (req, res) {
  // //   res.status(200).send('200 OK');
  // // });

  // app.get('/extension/login', pages.login); // Login page formatted for loading within extension iframe


  app.get('/api/user', ensureAuthenticated, function (req, res) {
    res.json(req.user);
  });


  app.get('/auth/facebook',
    passport.authenticate('facebook'),
    function () {});

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/extension/login' }),
    function(req, res) {
      res.redirect('/extension/loggedin');
    });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


};

function onlyFromSite (req, res, next) {

}

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401, 'false');
}
