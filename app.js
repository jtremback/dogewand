'use strict';

var express = require('express');
var passport = require('passport');
var config = require('./config/config')();


// bootstrap passport config
require('./config/passport')(passport, config);

var app = express();

// express settings
require('./config/express')(app, config, passport);

// expose app
module.exports = app;
