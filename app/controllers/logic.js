'use strict';

var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');

exports.createTip = function (tipper, opts, callback) {
  if (opts.username === tipper.username) callback(new Error('400 - You cannot tip yourself.'));
  Account.upsert({
    username: opts.username,
    provider: opts.provider
  }, function (err, tippee) {
    if (err) return callback(err);

    Tip.create(tipper, tippee, opts.amount, function (err, tip) {
      if (err) return callback(err);

      return callback(null, tip, tipper, tippee);
    });
  });
};