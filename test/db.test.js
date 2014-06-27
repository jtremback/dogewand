'use strict';

var test = require('tape');
var config = require('../config/config')('test');
var rpc = require('../app/models/rpc')(config.rpc);
var async = require('async');
var fs = require('fs');
var pg = require('pg');
var db = require('../app/models/db');

function resetDb (callback) {
  pg.connect(config.db, function (err, client, done) {
    client.query(
    ['DROP SCHEMA public CASCADE;',
    'CREATE SCHEMA public;',
    'GRANT ALL ON SCHEMA public TO jehan;',
    'GRANT ALL ON SCHEMA public TO public;',
    'COMMENT ON SCHEMA public IS \'standard public schema\';'].join('\n'),
    function (err) {
      if (err) return callback(err);
      client.query(fs.readFileSync(config.root + './tables.sql'), function (err) {
        if (err) return callback(err);

      });
    });
  });
}

test('---------------------------------------- db.js', function (t) {

  t.test('getUser', function () {
    client.query(
      ['INSERT INTO users (balance)',
       'VALUES (2340);',
       'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
       'VALUES (1, \'arya.stark\', \'farcebook\', \'Arya Stark\');',
       'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
       'VALUES (1, \'@aryastark\', \'twatter\', \'Arya Stark\');'
      ].join('\n'), function (err) {
      if (err) return callback(err);
      done(err);
      callback();
    });

    resetDb(function () {
      db.getUser(user_id, function (err, auth_user) {

      });
    });

  });

});