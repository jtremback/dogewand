'use strict';

var api = require('../app/controllers/api');
var pages = require('../app/controllers/pages');

module.exports = function (app, passport) {

  app.post('/api/v1/tips/create', ensureAuthenticated, api.createTip);

  app.post('/api/v1/tips/resolve', ensureAuthenticated, api.resolveTip);

  app.get('/api/v1/account', ensureAuthenticated, api.account);

  app.get('/api/v1/account/address', ensureAuthenticated, api.address);

  app.get('/api/v1/account/balance', ensureAuthenticated, api.updateBalance);

  app.post('/api/v1/account/withdraw', ensureAuthenticated, api.withdraw);

  app.get('/tips/:tip', pages.tip);
  app.post('/tips/:tip', pages.resolveTip);


  app.get('/auth/facebook', setRedirect(), passport.authenticate('facebook'));

  function setRedirect() {
    return function(req, res, next) {
      req.session.foo = req.query.redirect_to;
      console.log(req.session);
      return next();
    }
  }

  app.get('/auth/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/iframe#login_failed' }),
    function(req, res) {
      var redirect_to = req.session.foo ? req.session.foo : '/iframe';
      delete req.session.redirect;
      delete req.session.foo_to;
      //is authenticated ?
      res.redirect(redirect_to);
    });

  app.post('/auth/dogewand', passport.authenticate('local'), function (req, res) {
    if (req.query.page) return res.redirect(req.query.page);
    return res.redirect('/iframe');
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
