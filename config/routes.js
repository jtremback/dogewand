'use strict';

var pages = require('../app/controllers/pages');
var forms = require('../app/controllers/forms');


module.exports = function (app, passport) {

  app.get('/app/tips/create', pages.tipCreate);
  app.post('/app/tips/create', forms.createTip);

  app.get('/tips/:tip', pages.tip);
  app.post('/tips/:tip', forms.resolveTip);

  // app.get('/app/account/withdraw', pages.withdraw);
  // app.post('/app/account/withdraw', forms.withdraw);

  app.get('/app/account/address', pages.address);

  app.get('/app/account/login', pages.login);

  app.get('/app/toolbar', pages.toolbar);

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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.send(401, 'false');
}
