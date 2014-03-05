'use strict';

var api = require('../app/controllers/api'),
  pages = require('../app/controllers/pages')
;


module.exports = function (app, passport) {

  app.get('/', function(req, res){
    console.log(req);
    res.json({ user: req.user });
  });

  app.get('/api', function (req, res) {
    res.status(200).send('200 OK');
  });

  app.get('/extension/login', pages.login); // Login page formatted for loading within extension iframe


  app.get('/api/user', ensureAuthenticated, function (req, res) {
    res.json(req.user);
  });

  if (process.env.NODE_ENV === 'test') {
    app.get('/auth/none', passport.authenticate('local'));
  }

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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401, 'false');
}
