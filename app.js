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



require('./app/models/account.js');
require('./app/models/tip.js');

var Account = mongoose.model('Account');

// bootstrap passport config
require('./config/passport')(passport, config);

Account.upsert({username: 'shibetoshi', provider: 'dogewand', password: 'foo'}, function (err, account) {
  console.log(account);
});

var app = express();

// express settings
require('./config/express')(app, config, passport);

// Bootstrap routes
require('./config/routes')(app, passport);



// expose app
module.exports = app;
