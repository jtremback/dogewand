'use strict';

var express = require('express');
var passport = require('passport');
var path = require('path');
var config = require('./config/config');

console.log(config)
// bootstrap passport config
require('./config/passport')(passport, config);

var app = express();

// Serve static
app.use('/dist/', express.static(path.join(__dirname, 'static/dist')));

// express settings
require('./config/express')(app, config, passport);

// expose app
module.exports = app;
