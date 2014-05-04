'use strict';

var pages = require('../app/controllers/pages');
var forms = require('../app/controllers/forms');
var api = require('../app/controllers/api');

module.exports = function (app, passport) {

  app.get('/tips/:tip', pages.tip);
  app.post('/tips/:tip', forms.resolveTip);

  app.post('/api/tips/create', ensureAuthenticated, api.createTip);

  app.get('/api/account', ensureAuthenticated, api.account);

  app.get('/app/account/address', api.address);

  app.get('/app/account/login', pages.login);

  app.get('/auth/facebook', passport.authenticate('facebook'), function () {});

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/iframe#login_failed' }),
    function(req, res) {
      res.redirect('/iframe');
    });

  app.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
  });


};

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401, 'You need to log in.');
}
