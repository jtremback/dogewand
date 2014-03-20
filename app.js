'use strict';

var express = require('express')
  , fs = require('fs')
  , passport = require('passport')
  , config = require('./config/config')()
  , mongoose = require('mongoose');


// Connect to mongodb
mongoose.connect(config.db, {
  auto_reconnect: true,
  server: {
    socketOptions: {
      keepAlive: 1
    }
  }
});

// Error handler
mongoose.connection.on('error', function (err) {
  console.log(err);
});



// Bootstrap models
var models_path = __dirname + '/app/models';
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file);
});

// bootstrap passport config
require('./config/passport')(passport, config);



var app = express();

// express settings
require('./config/express')(app, config, passport);

// Bootstrap routes
require('./config/routes')(app, passport);



// expose app
module.exports = app;
