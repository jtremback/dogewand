'use strict';

process.env.NODE_ENV = 'test';

var test = require('tape');
var config = require('../config/config')('test');
var rpc = require('../app/models/rpc')(config.rpc);
var pgutils = require('../app/models/pg-utils')(config.db);
var async = require('async');
var fs = require('fs');
var pg = require('pg');
var db = require('../app/models/db');
var postgrator = require('postgrator');


postgrator.config.set({
  migrationDirectory: '../migrations',
  driver: 'pg',
  connectionString: config.db
});

function resetDb (callback) {
  pgutils.query(function (client, done) {
    client.query(
    ['DROP SCHEMA public CASCADE;',
    'CREATE SCHEMA public;',
    'GRANT ALL ON SCHEMA public TO jehan;',
    'GRANT ALL ON SCHEMA public TO public;',
    'COMMENT ON SCHEMA public IS \'standard public schema\';'].join('\n'),
    function (err) {
      if (err) return done(err);
      postgrator.migrate('001', callback);
    });
  }, callback);
}

test('---------------------------------------- db.js', function (t) {

  t.test('getUser', function () {

    resetDb(function (err) {
      t.error(err);
      pgutils.query(function (client, done) {
        client.query(
          ['INSERT INTO users (balance)',
           'VALUES (2340);',
           'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
           'VALUES (1, \'arya.stark\', \'farcebook\', \'Arya Stark\');',
           'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
           'VALUES (1, \'@aryastark\', \'twetter\', \'Arya Stark\');'
          ].join('\n'), function (err) {
            if (err) return done(err);
            done(err);
        });
      }, function (err) {
        t.error(err);
        db.getUser(1, function (err, user) {
          t.error(err);

          t.deepEqual(user, {
            user_id: 1,
            balance: 2340,
            accounts: [
              {
                uniqid: 'arya.stark',
                provider: 'farcebook',
                display_name: 'Arya Stark',
                account_id: 1
              }, {
                uniqid: '@aryastark',
                provider: 'twetter',
                display_name: 'Arya Stark',
                account_id: 2
              }
            ]
          });
        });
      });
    });
  });
});
