'use strict';

var config = require('../../config/config')();
var BlockIo = require('block_io');
var events = require('events');
var pgutils = require('./pg-utils')(config.db);
var blockIo = new BlockIo('42c9-b458-7867-0e2e');


module.exports = function (confirmations, timeout) {
  var eventEmitter = new events.EventEmitter();

  (function daemon () {
    blockIo.get_my_addresses({}, function (err, result) {
      if (err) eventEmitter.emit('error', err);

      result.data.addresses.forEach(function (address) {
        blockIo.get_address_received({'address': address.address}, function (err, result) {
          if (err) console.log('blockio daemon error: `', err);
          updateBalance(result.data.address, result.data.confirmed_received, function (err, result) {
            if (err) { console.log(err, result); }
          });
        });
      });

      setTimeout(daemon, timeout);
    });
  })();

  return eventEmitter;
};

function updateBalance (address, new_recieved, callback) {
  new_recieved = parseInt(new_recieved);

  pgutils.transaction(function (client, done) {
    client.query([
      'SELECT * FROM user_addresses',
      'WHERE address = $1;'
    ].join('\n'), [ address ], function (err, result) {
      if (err || !result.rows[0]) return done(err, null);

      return calcChange(result.rows[0].recieved);
    });

    function calcChange (old_received) {
      var change = new_recieved - old_received;

      if (change > 0) {
        updateBalance(change);
      } else {
        console.log('blockio daemon error: Invalid balance change: ', change);
      }
    }

    function updateBalance (change) {
      client.query([
        'UPDATE users',
        'SET balance = balance + $1',
        'WHERE user_id = (',
          'SELECT user_id FROM user_addresses',
          'WHERE address = $2)',
        'RETURNING *'
      ].join('\n'), [ change, address ], function (err, result) {
        if (err || !result.rows[0]) return done(err, null);
        console.log('updateBalanceResult', result.rows);
        return updateAddress();
      });
    }

    function updateAddress () {
      client.query([
        'UPDATE user_addresses',
        'SET recieved = $1',
        'WHERE address = $2',
        'RETURNING *'
      ].join('\n'), [ new_recieved, address ], function (err, result) {
        if (err || !result.rows[0]) return done(err, null);

        return done(null);
      });
    }


  }, callback);
}