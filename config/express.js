'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var connectMongo = require('connect-mongo')(express);
// var flash = require('connect-flash');


module.exports = function (app, config, passport) {

  app.set('showStackError', true);

  app.use(express.favicon());
  app.use(express.static('./public'));

  app.use(express.logger()); // LOGGING

  // set views path, template engine and default layout
  app.set('views', config.root + '/assets/templates/server');
  app.set('view engine', 'jade');
  app.disable('view cache');

  // cookieParser should be above session
  app.use(express.cookieParser());

  // bodyParser should be above methodOverride
  app.use(express.bodyParser());
  app.use(express.methodOverride());


  app.use(express.session({
    secret: config.sessionSecret,
    store: new connectMongo({
      url: config.db,
      collection : 'sessions'
    }, function () {
      console.log('db connection open'); // Is neccesary to avoid weird bug. (don't ask me why)
    })

  }));


  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // app.use(flash());

  // adds CSRF support
  // app.use(express.csrf());
  // app.use(function(req, res, next){
  //   res.locals.csrf_token = req.csrfToken();
  //   next();
  // });


  // // adds CORS support
  // app.all('*', function(req, res, next){
  //   if (!req.get('Origin')) return next();

  //   res.set('Access-Control-Allow-Origin', 'https://localhost:3700', 'https://facebook.com', 'https://soundcloud.com');
  //   res.set('Access-Control-Allow-Methods', 'GET, POST');
  //   res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type');
  //   res.header('Access-Control-Allow-Credentials', 'true');
  //   // res.set('Access-Control-Allow-Max-Age', 3600);
  //   if ('OPTIONS' == req.method) return res.send(200);
  //   next();
  // });


  // routes should be at the last
  app.use(app.router);

  // error
  app.use(function(err, req, res, next) {
    console.log(err);
    if (typeof err.name === 'string') {
      console.log(err.stack);
      return res.json(500, {
        data: 'wow such error.',
        error: true,
        status: 500
      });
    }
    else if (typeof err.name === 'number') {
      res.json(err.name, {
        status: err.name,
        error: true,
        data: err.message
      });
    }
  });

  // assume 404 since no middleware responded
  app.use(function(req, res){
    res.status(404).json({
      url: req.originalUrl,
      error: 'Not found'
    });
  });

};
