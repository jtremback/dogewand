'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var config = require('./config/config')('test');

// Connect to mongodb
(function () {
  var options = { server: { socketOptions: { keepAlive: 1 } }, auto_reconnect: true };
  mongoose.connect(config.db, options);
})();


// Bootstrap models
var fs = require('fs');
var path = require('path');
var models_path = path.resolve(__dirname, './app/models');
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js')) require(models_path + '/' + file);
});

var Account = mongoose.model('Account');

// The wrong way
var account = new Account();
account.save(function (err, account) {
  Account.findOne(account._id, function (err, found_account) {
    console.log(account, found_account);
  });
});


// The right way
var account = new Account();
account.save(function (err, account) {
  Account.findOne({ _id: account._id }, function (err, found_account) {
    console.log(account, found_account);
  });
});
