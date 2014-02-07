'use strict';

/**
 * Module dependencies.
 */

var express = require('express')
  , mongoStore = require('connect-mongo')(express)
;


module.exports = function (app, config, passport) {

  app.set('showStackError', true);

  app.use(express.favicon());
  app.use(express.static('./public'));

  app.use(express.logger()) // LOGGING

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


    /**
     * CORS support.
     */

    app.all('*', function(req, res, next){
      if (!req.get('Origin')) return next();
      // use "*" here to accept any origin
      res.set('Access-Control-Allow-Origin', 'https://localhost:3700', 'https://facebook.com', 'https://soundcloud.com');
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
      res.header('Access-Control-Allow-Credentials', 'true');
      // res.set('Access-Control-Allow-Max-Age', 3600);
      if ('OPTIONS' == req.method) return res.send(200);
      next();
    });


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
