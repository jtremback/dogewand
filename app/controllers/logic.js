'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');
var check = require('check-types');
var queue = require('../models/queue');

exports.createTip = function (user, opts, callback) {
  var tip_id = mongoose.Types.ObjectId(); // Make ObjectId out here to return it
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

    var new_balance = user.balance - opts.amount;

    if (new_balance >= 0) { // Insecure balance check to improve UX
      queue.pushCommand('Tip', 'create', [user, tippee, opts.amount, tip_id]);
      return callback(null, new_balance, tip_id);
    } else {
      return callback(new Error('Not enough doge.'));
    }
  });
};


exports.resolveTip = function (user, tip_id, callback) {
  if (!check.unemptyString(tip_id)) return callback(new Error(400));

  Tip.findOne({ _id: tip_id }, function (err, tip) {
    if ((user._id !== tip.tipper_id) && (user._id !== tip.tippee_id)) return callback(new Error('This is not your tip.'));
    if (tip.state === 'claimed') return callback(new Error('Tip has already been claimed.')); // This should be considered insecure
    if (tip.state === 'canceled') return callback(new Error('Tip has been cancelled.')); // The real checking happens in the model
    if (tip.state !== 'created') return callback(new Error('Tip error. Contact support.'));

    if (err) return callback(err);
    queue.pushCommand('Tip', 'resolve', [user, tip_id]);
    return callback(null, tip.amount + user.balance);
  });
};