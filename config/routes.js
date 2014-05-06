'use strict';

var api = require('../app/controllers/api');

module.exports = function (app, passport) {

  app.post('/api/v1/tips/create', ensureAuthenticated, api.createTip);

  app.post('/api/v1/tips/resolve', ensureAuthenticated, api.resolveTip);

  app.get('/api/v1/account', ensureAuthenticated, api.account);

  app.get('/api/v1/account/address', ensureAuthenticated, api.address);

  app.get('/api/v1/account/balance', ensureAuthenticated, api.updateBalance);


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
