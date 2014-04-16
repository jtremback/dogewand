'use strict';

var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

var models = {
  Tip: Tip,
  Account: Account
};

var queue = [];


exports.pushCommand = function (model, method, args) {
  var command = {
    model: model, // String
    method: method, // String
    args: args // Array
  };

  queue.push(command); // Add command to back of queue
};


var worker = function () {
  function callback (err) {
    if (err) { // For bad, unexpected errors, log it and crash. (Expected errors are saved to db inside the method)
      console.error(err);
      process.exit();
    }

    worker();
  }

  process.nextTick(function () {
    if (queue.length) { // If there are commands in the queue
      var command = queue.shift(); // Take command off front of queue
      command.args.push(callback); // Add callback
      models[command.model][command.method].apply(models[command.model], command.args); // Run command
    }

    setTimeout(function () {
      worker();
    }, 100); // Timeout on rechecking an empty queue (maybe this is uneccesary?)
  });
};


worker();