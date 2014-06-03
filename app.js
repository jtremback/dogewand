'use strict';

var express = require('express');
var passport = require('passport');
var config = require('./config/config')();
var mongoose = require('mongoose');


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



require('./app/models/user.js');
require('./app/models/tip.js');

var User = mongoose.model('User');


// bootstrap passport config
require('./config/passport')(passport, config);


User.upsert({username: 'shibetoshi', provider: 'dogewand', password: 'foo'}, function (err, user) {
  console.log(user);
});

var app = express();

// express settings
require('./config/express')(app, config, passport);

// Bootstrap routes
require('./config/routes')(app, passport);



// expose app
module.exports = app;
