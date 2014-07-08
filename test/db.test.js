'use strict';

process.env.NODE_ENV = 'test';

var test = require('tape');
var config = require('../config/config')('test');
var pgutils = require('../app/models/pg-utils')(config.db);
var DepositDaemon = require('../app/models/daemon');
var db = require('../app/models/db');
var postgrator = require('postgrator');

postgrator.config.set({
  migrationDirectory: '../migrations',
  driver: 'pg',
  connectionString: config.db
});

var migrate_to = '001';


function resetDb (callback) {
  pgutils.query([
    'DROP SCHEMA public CASCADE;',
    'CREATE SCHEMA public;',
    'GRANT ALL ON SCHEMA public TO jehan;',
    'GRANT ALL ON SCHEMA public TO public;',
    'COMMENT ON SCHEMA public IS \'standard public schema\';'
  ].join('\n'), function (err) {
    if (err) return callback(err);
    postgrator.migrate(migrate_to, function (err) {
      if (err) return callback(err);
      db.insertPgFunctions(callback);
    });
  });
}

function setupDb (query, callback) {
  resetDb(function (err) {
    if (err) return callback(err);
    pgutils.query(query, callback);
  });
}



test('---------------------------------------- db.js', function (t) {
  t.test('getUser', function (t) {
    setupDb([
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'Arya Stark\');',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"@aryastark"}\', \'twetter\', \'Arya Stark\');'
    ].join('\n'), function (err) {
      t.error(err, 'setup db');

      db.getUser(1, function (err, user) {
        t.error(err, 'db.getUser');

        t.deepEqual(user, {
          user_id: 1,
          balance: 1000,
          accounts: [
            {
              uniqid: ['arya.stark'],
              provider: 'farcebook',
              display_name: 'Arya Stark',
              account_id: 1
            }, {
              uniqid: ['@aryastark'],
              provider: 'twetter',
              display_name: 'Arya Stark',
              account_id: 2
            }
          ]
        }, 'returned user correct');

        t.end();
      });
    });
  });

  function testCreateTip (t, setup_string) {
    setupDb(setup_string, function (err) {
      t.error(err, 'db setup');
      db.createTip(1, 1, {
        uniqid: 'the.hound',
        provider: 'farcebook',
        display_name: 'The Hound',
        amount: 500
      }, checkResult);
    });

    function checkResult (err, new_balance, tip_id) {
      t.error(err, 'db.createTip');
      t.equal(new_balance, 500, 'new_balance correct');
      t.ok(tip_id.match(/\w{8}\-\w{4}\-\w{4}\-\w{4}\-\w{12}/), 'tip_id in expected format');
      pgutils.query([
        'SELECT * FROM tips',
        'WHERE tip_id = $1;'
      ].join('\n'), [ tip_id ], function (err, result) {
        t.error(err, 'select from tips');
        var tip = result.rows[0];
        t.deepEqual(tip, {
          tip_id: tip_id,
          tipper_id: 1,
          tippee_id: 2,
          amount: '500',
          state: 'created'
        }, 'return tip correct');
        t.end();
      });
    }
  }

  t.test('createTip to existing', function (t) {
    testCreateTip(t, [
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO users (balance)',
      'VALUES (0);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'Arya Stark\');',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (2, \'{"the.hound"}\', \'farcebook\', \'The Hound\');'
    ].join('\n'));
  });

  t.test('createTip to new', function (t) {
    testCreateTip(t, [
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'Arya Stark\');'
    ].join('\n'));
  });



  t.test('getTip', function (t) {
    setupDb([
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'Arya Stark\');'
    ].join('\n'), function (err) {
      t.error(err, 'db setup');
      db.createTip(1, 1, {
        uniqid: 'the.hound',
        provider: 'farcebook',
        display_name: 'The Hound',
        amount: 500
      }, function (err, balance, tip_id) {
        db.getTip(tip_id, function (err, tip) {
          checkResult(err, tip, tip_id);
        });
      });
    });

    function checkResult (err, tip, tip_id) {
      t.error(err, 'getTip');

      t.deepEqual(tip, {
        amount: 500,
        state: 'created',
        tip_id: tip_id,
        tipper: {
          account_id: 1,
          uniqid: ['arya.stark'],
          provider: 'farcebook',
          display_name: 'Arya Stark'
        },
        tippee: {
          account_id: 2,
          uniqid: ['the.hound'],
          provider: 'farcebook',
          display_name: 'The Hound'
        }
      }, 'tip is correct');

      t.end();
    }
  });


  function testResolveTip (t, user_id) {
    setupDb([
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO users (balance)',
      'VALUES (0);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'Arya Stark\');',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (2, \'{"the.hound"}\', \'farcebook\', \'The Hound\');'
    ].join('\n'), function (err) {
      t.error(err, 'db setup');
      db.createTip(1, 1, {
        uniqid: 'the.hound',
        provider: 'farcebook',
        display_name: 'The Hound',
        amount: 500
      }, function (err, balance, tip_id) {
        t.error(err, 'db.createTip');
        db.resolveTip(user_id, tip_id, function (err, new_balance) {
          t.error(err, 'db.resolveTip');
          checkResult(new_balance, tip_id);
        });
      });
    });

    function checkResult (new_balance, tip_id) {
      t.equal(new_balance, (1000 / user_id), 'new_balance correct'); // Gets correct amount based on user_id

      pgutils.query([
        'SELECT * FROM tips',
        'WHERE tip_id = $1;'
      ].join('\n'), [ tip_id ], function (err, result) {
        t.error(err, 'select from tips');
        var tip = result.rows[0];
        var states = [ 'canceled', 'claimed' ];

        t.deepEqual(tip, {
          tip_id: tip_id,
          tipper_id: 1,
          tippee_id: 2,
          amount: '500',
          state: states[ user_id - 1 ] // Selectes correct state depending on user_id
        }, 'return tip correct');
        t.end();
      });
    }
  }

  t.test('cancel tip', function (t) {
    testResolveTip(t, 1);
  });

  t.test('claim tip', function (t) {
    testResolveTip(t, 2);
  });


  t.test('withdraw and deposit', function (t) {
    setupDb([
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO users (balance)',
      'VALUES (1000);'
    ].join('\n'), function (err) {
      t.error(err, 'setup db');
      db.getAddress(2, function (err, address) {
        t.error(err, 'getAddress');
        db.withdraw(1, {
          address: address,
          amount: 500
        }, function (err, new_balance, withdrawal) {
          t.error(err, 'withdraw');
          t.equal(new_balance, 500);
          var txid = withdrawal.txid;
          var daemon = new DepositDaemon(0, 1000);

          daemon.on('error', function (error) {
            error = 0; // Shutup
          });

          daemon.on('deposit', function (result) {
            t.deepEqual(result, {
              deposit: {
                txid: txid,
                address: address,
                amount: 500
              }, user: {
                user_id: 2,
                balance: 1500
              }
            });

            t.end();
          });
        });
      });
    });
  });



  function testAuth (t, setup_string) {
    setupDb(setup_string, function (err) {
      t.error(err, 'setup db');
      db.auth({
        uniqid: 'arya.stark',
        provider: 'farcebook',
        display_name: 'Arya Stark'
      }, function (err, user_id) {
        t.error(err, 'db.auth');
        t.equal(user_id, 1, 'user_id correct');
        return checkUser();
      });
    });

    function checkUser () {
      db.getUser(1, function (err, user) {
        t.error(err, 'db.getUser');

        t.deepEqual(user, {
          user_id: 1,
          balance: 0,
          accounts: [
            {
              uniqid: ['arya.stark'],
              provider: 'farcebook',
              display_name: 'Arya Stark',
              account_id: 1
            }
          ]
        }, 'returned user correct');

        t.end();
      });
    }
  }

  t.test('auth existing account, existing user', function (t) {
    testAuth(t, [
      'INSERT INTO users (balance)',
      'VALUES (0);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'fooham\');'
    ].join('\n'));
  });

  t.test('auth existing account, nonexistant user', function (t) {
    testAuth(t, [
      'INSERT INTO accounts (uniqid, provider, display_name)',
      'VALUES (\'{"arya.stark"}\', \'farcebook\', \'fooham\');'
    ].join('\n'));
  });

  t.test('auth nonexistant account, nonexistant user', function (t) {
    testAuth(t, []);
  });

  t.test('mergeUsers', function (t) {
    setupDb([
      'INSERT INTO users (balance)',
      'VALUES (1000);',
      'INSERT INTO users (balance)',
      'VALUES (500);',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (1, \'{"arya.stark"}\', \'farcebook\', \'Arya Stark\');',
      'INSERT INTO accounts (user_id, uniqid, provider, display_name)',
      'VALUES (2, \'{"the.hound"}\', \'farcebook\', \'The Hound\');',
      'INSERT INTO user_addresses (user_id, address)',
      'VALUES (1, \'DJDBE9JqeMAvwKMofE9yVZaTBkERbx6GW6\');',
      'INSERT INTO user_addresses (user_id, address)',
      'VALUES (2, \'DKYHBsn3m6VHi24gwc9sXU1sFRihok4G3T\');'
    ].join('\n'), function (err) {
      t.error(err, 'db setup');
      db.mergeUsers(1, 2, function (err) {
        t.error(err, 'db.mergeUsers');
        db.getUser(1, function (err, user) {
          t.error(err, 'db.getUser');

          t.deepEqual(user, {
            user_id: 1,
            balance: 1500,
            accounts: [{
              account_id: 1,
              uniqid: ['arya.stark'],
              provider: 'farcebook',
              display_name: 'Arya Stark'
            }, {
              account_id: 2,
              uniqid: ['the.hound'],
              provider: 'farcebook',
              display_name: 'The Hound'
            }]
          }, 'returned user correct');

          pgutils.query([
            'SELECT * FROM user_addresses',
            'WHERE user_id = 1;'
          ].join('\n'), function (err, result) {
            t.error(err, 'get addresses');
            t.deepEqual(result.rows, [{
              address: 'DJDBE9JqeMAvwKMofE9yVZaTBkERbx6GW6',
              user_id: 1
            }, {
              address: 'DKYHBsn3m6VHi24gwc9sXU1sFRihok4G3T',
              user_id: 1
            }], 'addresses correct');
            t.end();
          });

        });
      });
    });
  });

  t.test('exit', function () {
    t.end();
    process.exit();
  });

});
