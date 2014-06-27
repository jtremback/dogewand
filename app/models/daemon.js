'use strict';

var db = require('./db.js');
var config = require('../../config/config')();
var rpc = require('./rpc.js')(config.rpc);

function asyncTimeout (fn, timeout) {
  setTimeout(fn, timeout);
}

var lastblock;

function depositDaemon () {
  rpc({
    method: 'listsinceblock',
    params: [ lastblock || '', 6 ]
  }, function (err, result) {
    if (err) console.log(err);

    lastblock = result.lastblock;
    result.transactions.forEach(function (item) {
      if (item.category === 'receive') {
        db.addDeposit(item, function (err) {
          if (err) console.log(err);
        });
      }
    });

    asyncTimeout(depositDaemon, 2000);
  });
}

depositDaemon();
