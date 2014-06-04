'use strict';

var mongoose = require('mongoose');
var User = mongoose.model('User');
var Tip = mongoose.model('Tip');
var check = require('check-types');
var queue = require('../models/queue');
var coinstring = require('coinstring');
var utils = require('../../utils.js');

exports.createTip = function (user, opts, callback) {
  var tip_id = mongoose.Types.ObjectId().toString(); // Make ObjectId out here to return it

  var valid = check.every(
    check.map(opts, {
      uniqid: check.unemptyString,
      provider: check.unemptyString,
      amount: check.number,
      name: check.unemptyString
    })
  );

  if (!valid) return callback(new utils.NamedError('Such not compute.', 400));

  User.upsert({
    uniqid: opts.uniqid,
    provider: opts.provider
  }, function (err, tippee) {
    if (err) return callback(err);

    opts._id = tippee._id;

    if ((user.balance - opts.amount) >= 0) { // Insecure balance check to improve UX
      queue.pushCommand('Tip', 'create', [user, opts, tip_id]);

      user.pending = user.pending - opts.amount;
      return user.save(function () {
        callback(null, user, tip_id);
      });
    } else {
      return callback(new utils.NamedError('Not enough doge.', 402));
    }
  });
};


exports.resolveTip = function (tip_id, user, callback) {
  if (!check.unemptyString(tip_id)) return callback(new Error('No tip_id supplied.'));
  Tip.findOne({ _id: tip_id }, function (err, tip) {
    if (err) return callback(err);

    var user_id = user._id.toString();
    var tipper_id = tip.tipper._id.toString();
    var tippee_id = tip.tippee._id.toString();


    console.log('LOGIC JS RESOLVETIP TIP, USER', tip, user);
    // There are many different error states here.
    // These are re-checked in the model when the request is made
    if (err) return callback(err);
    if (!tip) return callback(new Error('No tip found.'));
    if ((user_id !== tipper_id) && (user_id !== tippee_id)) return callback(new utils.NamedError('This is not your tip.', 403));
    if (tip.state === 'claimed') return callback(new utils.NamedError('Tip has already been claimed.', 403)); // This should be considered insecure
    if (tip.state === 'canceled') return callback(new utils.NamedError('Tip has been cancelled.', 403)); // The real checking happens in the model
    if (tip.state !== 'created') return callback(new Error('Tip error.'));

    queue.pushCommand('Tip', 'resolve', [tip, user]);

    user.pending = user.pending + tip.amount;
    return user.save(callback);
  });
};

exports.withdraw = function (user, to_address, amount, callback) {
  if (!check.positiveNumber(amount)) return callback(new utils.NamedError('Invalid amount.', 400));
  if (!coinstring.validate(0x1E, to_address)) return callback(new utils.NamedError('Not a valid dogecoin address.', 400));

  if (user.balance - amount < 0) {
    return callback(new utils.NamedError('Not enough dogecoin.', 402)); // insecure
  }

  queue.pushCommand('User', 'withdraw', [user, to_address, amount]);

  user.pending = user.pending - amount;
  user.save(callback);
};