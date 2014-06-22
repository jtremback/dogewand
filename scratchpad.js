'use strict';

var db = require('./app/db.js');
var config = require('./config/config')();
var rpc = require('./app/rpc.js')(config.rpc);
var _ = require('lodash');


// db.auth({
//   uniqid: 'arya.stark',
//   provider: 'farcebook',
//   display_name: 'warrps'
// }, function (err, user) {
//   if (err) console.log('ERRRRRRRR', err);
//   console.log('AUTH', user);
// });

// db.createTip(4, 2, {
//   // uniqid: 'the.hound',
//   // provider: 'farcebook',
//   uniqid: 'arya.stark',
//   provider: 'farcebook',
//   display_name: 'hoopla',
//   amount: 5
// }, function (err, result) {
//   if (err) return console.log('ERRRRRRRR', err);
//   console.log('CREATE', result );

//   db.resolveTip(1, result.tip_id, function (err, result) {
//     if (err) return console.log('ERRRRRRRR', err);
//     console.log('RESOLVE', result);
//   });
// });

function asyncTimeout (fn, timeout) {
  setTimeout(fn, timeout);
}

var lastblock;

function worker () {
  console.log('worker')
  rpc({
    method: 'listsinceblock',
    params: [ lastblock || '', 6 ]
  }, function (err, result) {
    console.log(err, result);
    lastblock = result.lastblock;
    result.transactions.forEach(function (item) {
      if (item.category === 'receive') {
        db.addDeposit(item, function (err, result) {

        });
      }
    });
    asyncTimeout(worker, 2000);
  });
}

worker();

// PLAN
// get all transactions
// save lastblock
// credit received transaction to account with address
//
// table of transactions, store txid, address, blockhash
//
// check table of transactions, WHERE address = address AND
//