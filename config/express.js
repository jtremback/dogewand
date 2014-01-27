'use strict';

/**
 * Module dependencies.
 */

var express = require('express')
  , mongoStore = require('connect-mongo')(express)
  , config = require('./config')();


module.exports = function (app, config, passport) {

  app.set('showStackError', true);

  // should be placed before express.static
  app.use(express.compress({
    filter: function (req, res) {
      return (/json|text|javascript|css/).test(res.getHeader('Content-Type'));
    },
    level: 9
  }));

  app.use(express.favicon());
  app.use(express.static('../public'));

  // set views path, template engine and default layout
  app.set('views', './app/views');
  app.set('view engine', 'jade');

  app.configure(function () {

    // cookieParser should be above session
    app.use(express.cookieParser());

    // bodyParser should be above methodOverride
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    // express/mongo session storage
    app.use(express.session({
      secret: config.sessionSecret,
      store: new mongoStore({
        url: config.db,
        collection : 'sessions'
      })
    }));

    // use passport session
    app.use(passport.initialize());
    app.use(passport.session());

    // adds CSRF support
    if (process.env.NODE_ENV !== 'test') {
      app.use(express.csrf());

      // This could be moved to view-helpers :-)
      app.use(function(req, res, next){
        res.locals.csrf_token = req.csrfToken();
        next();
      });
    }

    // routes should be at the last
    app.use(app.router);

    // assume 404 since no middleware responded
    app.use(function(req, res, next){
      res.status(404).json({
        url: req.originalUrl,
        error: 'Not found'
      });
    });
  });

  // development env config
  app.configure('development', function () {
    app.locals.pretty = true;
  });
};
