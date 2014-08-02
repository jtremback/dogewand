'use strict';

var api = require('../app/controllers/api');
var pages = require('../app/controllers/pages');
var utils = require('../utils.js');

module.exports = function (app, passport) {

  app.post('/api/v1/tips/create', ensureAuthenticated, api.createTip);

  app.post('/api/v1/tips/resolve', ensureAuthenticated, api.resolveTip);

  app.get('/api/v1/user', ensureAuthenticated, api.user);

  app.get('/api/v1/user/address', ensureAuthenticated, api.address);

  app.post('/api/v1/user/withdraw', ensureAuthenticated, api.withdraw);

  app.get('/api/v1/user/username', ensureAuthenticated, api.checkUsername);

  app.post('/api/v1/user/username', ensureAuthenticated, api.setUsername);

  app.get('/api/v1/accounts', api.getAccount);

  app.get('/', function (req, res) {
    return res.send('dogewand');
  });


  app.get('/tips/:tip', pages.tip);
  app.post('/tips/:tip', ensureAuthenticated, pages.resolveTip);

  app.get('/profile', ensureAuthenticated, pages.profile);
  app.post('/withdraw', ensureAuthenticated, pages.withdraw);

  app.get('/iframe', pages.iframe);

  app.get('/auth/Facebook', preserveParam('redirect_to'), preserveParam('merge'), passport.authenticate('facebook'));
  app.get('/auth/Youtube', preserveParam('redirect_to'), preserveParam('merge'), passport.authenticate('youtube'));
  app.get('/auth/Reddit', preserveParam('redirect_to'), preserveParam('merge'), passport.authenticate('reddit', { state: 'what' }));


  function preserveParam (name) {
    return function (req, res, next) {
      req.session[name] = req.param(name);
      return next();
    };
  }

  app.get('/auth/facebook/callback', passport.authenticate('facebook', { failureRedirect: '/profile' }), api.authRedirect);
  app.get('/auth/youtube/callback', passport.authenticate('youtube', { failureRedirect: '/profile' }), api.authRedirect);
  app.get('/auth/reddit/callback', passport.authenticate('reddit', { failureRedirect: '/profile'}), api.authRedirect);


  app.get('/logout', function(req, res){
    req.logout();
    res.send(new utils.SuccessResponse());
  });
};

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  return next(new utils.NamedError('You need to sign in.', 401));
}
