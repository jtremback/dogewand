'use strict';

/**
 * Module dependencies.
 */

var express = require('express');
var pg = require('pg');
var session = require('express-session');
var pgSession = require('connect-pg-simple')(session);
var morgan = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var csrf = require('csurf');
var path = require('path');



module.exports = function (app, config, passport) {

  app.set('showStackError', true);

  if (process.env.NODE_ENV === 'dev') {
    app.use(express.static('./static'));
  }

  app.use(morgan('dev')); // LOGGING

  // set views path, template engine and default layout and static
  app.use('/static/', express.static(path.join(__dirname, 'static')));
  app.set('views', config.root + '/assets/templates/server');
  app.set('view engine', 'jade');
  app.disable('view cache');

  // cookieParser should be above session
  app.use(cookieParser());

  // bodyParser should be above methodOverride
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));


  app.use(session({
    store: new pgSession({
      pg: pg,
      conString: config.db
    }),
    secret: config.sessionSecret,
    cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
  }));


  // use passport session
  app.use(passport.initialize());
  app.use(passport.session());

  // adds CSRF support
  app.use(csrf());

  app.use(function(req, res, next) {
    res.cookie('CSRF-TOKEN', req.csrfToken());
    next();
  });

  // Bootstrap routes
  require('./routes')(app, passport);

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
