'use strict';

var config = require('../../config/config');
var rpc = require('./rpc.js')(config.rpc);
var events = require('events');
var pgutils = require('./pg-utils')(config.db);


module.exports = function (confirmations, timeout) {
  var lastblock;
  var eventEmitter = new events.EventEmitter();

  (function daemon () {
    rpc('listsinceblock', [ (lastblock || ''), confirmations || 1 ], function (err, result) {
      if (err) eventEmitter.emit('error', err);
      lastblock = result.lastblock;

      result.transactions.forEach(function (item) {
        if (item.category === 'receive' && item.confirmations === confirmations) {
          addDeposit(item, function (err, result) {
            if (err) eventEmitter.emit('error', err);
            if (result) eventEmitter.emit('deposit', result);
          });
        }
      });

      setTimeout(daemon, timeout);
    });
  })();

  return eventEmitter;
};

function addDeposit (opts, callback) {
  pgutils.transaction(function (client, done) {

    var amount = Math.floor(opts.amount); // Get rid of floating point
    var ret = {};

    client.query([
      'INSERT INTO deposits (txid, address, amount)',
      'VALUES ($1, $2, $3)',
      'RETURNING *;'
    ].join('\n'), [ opts.txid, opts.address, amount ], function (err, result) {
      if (err) return done(err);
      result.rows[0].amount = parseInt(result.rows[0].amount, 10);
      ret.deposit = result.rows[0];
      return updateBalance();
    });

    function updateBalance () {
      client.query([
        'UPDATE users',
        'SET balance = balance + $1',
        'WHERE user_id = (',
          'SELECT user_id FROM user_addresses',
          'WHERE address = $2)',
        'RETURNING *'
      ].join('\n'), [ amount, opts.address ], function (err, result) {
        if (err) return done(err);
        result.rows[0].balance = parseInt(result.rows[0].balance, 10);
        ret.user = result.rows[0];
        return done(null, ret);
      });
    }
  }, callback);
}