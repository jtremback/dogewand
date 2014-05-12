'use strict';

var mongoose = require('mongoose');
var config = require('../../config/config')();
var Account = mongoose.model('Account');
var Tip = mongoose.model('Tip');
var check = require('check-types');
var queue = require('../models/queue');
var coinstring = require('coinstring');

var NamedError = function(message, name) {
    var error = new Error(message);
    error.name = name;
    return error;
};

exports.createTip = function (account, opts, callback) {
  var tip_id = mongoose.Types.ObjectId().toString(); // Make ObjectId out here to return it
  var valid = check.every(
    check.map(opts, {
      username: check.unemptyString,
      provider: check.unemptyString,
      amount: check.number
    })
  );

  if (!valid) return callback(new Error(400));
  if (opts.username === account.username) callback(new Error('You cannot tip yourself.'));


  Account.upsert({
    username: opts.username,
    provider: opts.provider
  }, function (err, tippee) {
    if (err) return callback(err);

    var new_balance = account.balance - opts.amount;

    if (new_balance >= 0) { // Insecure balance check to improve UX
      queue.pushCommand('Tip', 'create', [account, tippee, opts.amount, tip_id]);
      return callback(null, new_balance, tip_id);
    } else {
      // var error = new Error('Not enough doge.');
      // error.name = 402;
      // return callback(error);

      return callback(new NamedError('Not enough doge.', 402));
    }
  });
};


exports.resolveTip = function (tip_id, account, callback) {
  if (!check.unemptyString(tip_id)) return callback(new Error('No tip_id supplied.'));
  Tip.findOne({ _id: tip_id }, function (err, tip) {
    if (err) return callback(err);

    var account_id = account._id.toString();
    var tipper_id = tip.tipper_id.toString();
    var tippee_id = tip.tippee_id.toString();

    console.log('LOGIC JS RESOLVETIP TIP, ACCOUNT', tip, account);
    // There are many different error states here.
    // These are re-checked in the model when the request is made
    if (err) return callback(err);
    if (!tip) return callback(new Error('No tip found.'));
    if ((account_id !== tipper_id) && (account_id !== tippee_id)) return callback(new NamedError('This is not your tip.', 403));
    if (tip.state === 'claimed') return callback(new NamedError('Tip has already been claimed.', 403)); // This should be considered insecure
    if (tip.state === 'canceled') return callback(new NamedError('Tip has been cancelled.', 403)); // The real checking happens in the model
    if (tip.state !== 'created') return callback(new Error('Tip error.'));

    queue.pushCommand('Tip', 'resolve', [tip, account]);
    return callback(null, tip.amount + account.balance);
  });
};

exports.withdraw = function (account, to_address, amount, callback) {
  if (!check.positiveNumber(amount)) return callback(new NamedError('Invalid amount.', 400));
  if (!coinstring.validate(0x1E, to_address)) return callback(new NamedError('Not a valid dogecoin address.', 400));

  var new_balance = account.balance - amount;
  if (new_balance < 0) {
    return callback(new NamedError('Not enough dogecoin.', 402)); // insecure
  }

  queue.pushCommand('Account', 'withdraw', [account, to_address, amount]);
  return callback(null, new_balance);
};