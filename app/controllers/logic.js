'use strict';

var mongoose = require('mongoose');
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');
var check = require('check-types');


exports.createTip = function (user, opts, callback) {
  var valid = check.every(
    check.map(opts, {
      username: check.unemptyString,
      provider: check.unemptyString,
      amount: check.number
    })
  );

  if (!valid) return callback(new Error(400));
  if (opts.username === user.username) callback(new Error('You cannot tip yourself.'));

  Account.upsert({
    username: opts.username,
    provider: opts.provider
  }, function (err, tippee) {
    if (err) return callback(err);

    Tip.create(user, tippee, opts.amount, function (err, tip) {
      if (err) return callback(err);

      return callback(null, tip, user, tippee);
    });
  });
};


exports.resolveTip = function (user, tip_id, callback) {
  if (!check.unemptyString(tip_id)) return callback(new Error(400));

  Tip.resolve(user, tip_id, function (err, tip) {
    if (err) return callback(err);
    return callback(null, tip, user);
  });
};