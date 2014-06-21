'use strict';

var db = require('./app/db.js');
var pg = require('pg');

// pg.defaults.database = 'test'

db.auth('fu', 'shiba', 'warrps', function (err, result) {
  if (err) console.log('ERRRRRRRR', err);
  console.log('AUTH', result.rows);
});

db.createTip(2, 4, {
  // uniqid: 'the.hound',
  // provider: 'farcebook',
  uniqid: 'arya.stark',
  provider: 'farcebook',
  display_name: 'hoopla',
  amount: 5
}, function (err, result) {
  if (err) return console.log('ERRRRRRRR', err);
  console.log('CREATE', result );

  db.resolveTip(1, result.tip_id, function (err, result) {
    if (err) return console.log('ERRRRRRRR', err);
    console.log('RESOLVE', result);
  });
});

// db.test(function (err, results) {
//   console.log(err, results)
// })