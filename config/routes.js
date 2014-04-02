'use strict';

var pages = require('../app/controllers/pages');
var forms = require('../app/controllers/forms');


module.exports = function (app, passport) {

  app.get('/', pages.app);

  app.get('/tips/create', pages.tipCreate);
  app.post('/tips/create', forms.createTip);

  app.get('/tips/:tip', pages.tip);
  app.post('/tips/:tip', forms.resolveTip);


  app.get('/api/user', ensureAuthenticated, function (req, res) {
    res.json(req.user);
  });

  app.get('/auth/login', pages.login);

  app.get('/auth/facebook', passport.authenticate('facebook'), function () {});

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
