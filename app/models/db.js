'use strict';

var config = require('../../config/config')();
var pgutils = require('./pg-utils')(config.db);
var rpc = require('./rpc')(config.rpc);
var pg = require('pg');
var fs = require('fs');

exports.insertPgFunctions = function (callback) {
  pg.connect(config.db, function (err, client, done) {
    client.query(fs.readFileSync(config.root + '/app/models/functions.sql', 'utf8'), function (err, result) {
      done(err);
      return callback(err, result);
    });
  });
};

exports.getUser = function (user_id, callback) {
  pgutils.query([
    'SELECT * FROM users',
    'INNER JOIN accounts ON accounts.user_id = users.user_id',
    'WHERE users.user_id = $1'
  ].join('\n'), [ user_id ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);

    var user = {
      user_id: result.rows[0].user_id,
      balance: Math.floor(result.rows[0].balance)
    };

    var accounts = result.rows.map(function (item) {
      delete item.user_id;
      delete item.balance;
      return item;
    });

    user.accounts = accounts;
    return callback(null, user);
  });
};


exports.createTip = function (user_id, account_id, opts, callback) {
  pgutils.transaction(function (client, done) {

    client.query([ // Get or insert account for tippee
      'SELECT * FROM accountInsertOrSelect($1, $2, $3)',
      'AS (account_id int, user_id int, uniqid text[], provider text, display_name text)'
    ].join('\n'), [ opts.uniqid, opts.provider, opts.display_name ], function (err, result) {
      if (err || !result.rows[0]) return callback(err, null);
      return insertTip(result.rows[0].account_id);
    });

    function insertTip (tippee_id) {
      client.query([
        'INSERT INTO tips (tipper_id, tippee_id, amount)',
        'VALUES ($1, $2, $3)',
        'RETURNING *;'
      ].join('\n'), [ account_id, tippee_id, opts.amount ], function (err, result) {
        if (err || !result.rows[0]) return callback(err, null);
        return updateBalance(result.rows[0].tip_id);
      });
    }

    function updateBalance (tip_id) {
      client.query([
        'UPDATE users SET balance = balance - $1',
        'WHERE user_id = $2 RETURNING *'
      ].join('\n'), [ opts.amount, user_id ], function (err, result) {
        if (err || !result.rows[0]) return callback(err, null);
        return done(null, Math.floor(result.rows[0].balance), tip_id);
      });
    }
  }, callback);
};


exports.resolveTip = function (user_id, tip_id, callback) {
  pgutils.transaction(function (client, done) {
    client.query([
      'UPDATE tips t',
      'SET state = CASE WHEN t.tippee_id = a.account_id THEN \'claimed\'::tip_state',
                      'WHEN t.tipper_id = a.account_id THEN \'canceled\'::tip_state',
                      'END',
      'FROM accounts a WHERE user_id = $1 AND tip_id = $2 AND state = \'created\'::tip_state',
      'AND (t.tippee_id = a.account_id OR t.tipper_id = a.account_id)',
      'RETURNING *;'
    ].join('\n'), [ user_id, tip_id ], function (err, result) {
      if (err || !result.rows[0]) return callback(err, null);
      if (!result.rowCount) return done(new Error('Resolve Error'));
      return updateBalance(result.rows[0].amount);
    });


    function updateBalance (amount) {
      client.query([
        'UPDATE users',
        'SET balance = balance + $1',
        'WHERE user_id = $2',
        'RETURNING balance;'
      ].join('\n'), [ amount, user_id ], function (err, result) {
        if (err || !result.rows[0]) return callback(err, null);
        return done(null, Math.floor(result.rows[0].balance));
      });
    }
  }, callback);
};


exports.getTip = function (tip_id, callback) {
  pgutils.query([
    'SELECT * FROM tips',
    'INNER JOIN accounts',
    'ON accounts.account_id = tips.tipper_id',
    'OR accounts.account_id = tips.tippee_id',
    'WHERE tip_id = $1',
  ].join('\n'), [ tip_id ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);

    var tipper = (result.rows[0].account_id === result.rows[0].tipper_id) ? 0 : 1;
    var tippee = tipper ? 0 : 1;

    var tip = {
      amount: Math.floor(result.rows[0].amount),
      state: result.rows[0].state,
      tip_id: result.rows[0].tip_id,
      tipper: {
        uniqid: result.rows[tipper].uniqid,
        provider: result.rows[tipper].provider,
        display_name: result.rows[tipper].display_name,
        account_id: result.rows[tipper].account_id
      },
      tippee: {
        uniqid: result.rows[tippee].uniqid,
        provider: result.rows[tippee].provider,
        display_name: result.rows[tippee].display_name,
        account_id: result.rows[tippee].account_id
      }
    };

    return callback(null, tip);
  });
};


exports.getAddress = function (user_id, callback) {
  pgutils.transaction(function (client, done) {
    client.query([
      'SELECT * FROM user_addresses',
      'WHERE user_id = $1;'
    ].join('\n'), [ user_id ], function (err, result) {
      if (err) return callback(err, null);
      if (result.rows[0] && result.rows[0].address) return done(null, result.rows[0].address);
      return newAddress();
    });

    function newAddress () {
      rpc('getnewaddress', [], function (err, address) {
        if (err || !address) return done(err, null);
        client.query([
          'INSERT INTO user_addresses (address, user_id)',
          'VALUES ($1, $2);'
        ].join('\n'), [ address, user_id ], function (err) {
          return done(err, address);
        });
      });
    }
  }, callback);
};


exports.withdraw = function (user_id, opts, callback) {
  pgutils.transaction(function (client, done) {

    var new_balance;

    client.query([
      'UPDATE users',
      'SET balance = balance - $2',
      'WHERE user_id = $1',
      'RETURNING balance'
    ].join('\n'), [ user_id, opts.amount ], function (err, result) {
      if (err || !result.rows[0]) return callback(err, null);
      new_balance = Math.floor(result.rows[0].balance);
      return sendFunds();
    });

    function sendFunds () {
      rpc('sendtoaddress', [ opts.address, opts.amount ], function (err, result) {
        if (err) return done(err);
        return insertWithdrawal(result);
      });
    }

    function insertWithdrawal (txid) {
      client.query([
        'INSERT INTO withdrawals (txid, amount, user_id)',
        'VALUES ($1, $2, $3)',
        'RETURNING *;'
      ].join('\n'), [ txid, opts.amount, user_id ], function (err, result) {
        if (err || !result.rows[0]) return callback(err, null);
        result.rows[0].amount = Math.floor(result.rows[0].amount);
        return done(null, new_balance, result.rows[0]);
      });
    }
  }, callback);
};


exports.auth = function (opts, callback) {
  console.log('auth')
  pgutils.transaction(function (client, done) {

    client.query([
      'SELECT * FROM accountInsertOrUpdate($1, $2, $3)',
      'AS (account_id int, user_id int, uniqid text[], provider text, display_name text)'
    ].join('\n'), [ opts.uniqid, opts.provider, opts.display_name ], function (err, result) {
      if (err || !result.rows[0]) return callback(err, null);
      var user = result.rows[0];
      console.log('authuser', user)
      if (!user.user_id) return insertUser(user.account_id); // If the account does not have a user make one
      return done(null, user.user_id);
    });

    function insertUser (account_id) {
      client.query([
        'WITH u AS (',
          'INSERT INTO users (balance)',
          'VALUES (0)',
          'RETURNING user_id)',
        'UPDATE accounts',
        'SET user_id = (SELECT user_id FROM u)',
        'WHERE account_id = $1',
        'RETURNING user_id'
      ].join('\n'), [ account_id ], function (err, result) {
        if (err || !result.rows[0]) return callback(err, null);
        return done(null, result.rows[0].user_id);
      });
    }
  }, callback);
};


exports.mergeUsers = function (new_user, old_user, callback) {
  pgutils.transaction(function (client, done) {

    client.query([
      'UPDATE users',
      'SET balance = balance + (',
        'SELECT balance FROM users',
        'WHERE user_id = $2)',
      'WHERE user_id = $1'
    ].join('\n'), [ new_user, old_user ], function (err) {
      if (err) return done(err);
      return updateAccounts();
    });

    function updateAccounts () {
      client.query([
        'UPDATE accounts',
        'SET user_id = $1',
        'WHERE user_id = $2'
      ].join('\n'), [ new_user, old_user ], function (err) {
        if (err) return done(err);
        return updateAddresses();
      });
    }

    function updateAddresses () {
      client.query([
        'UPDATE user_addresses',
        'SET user_id = $1',
        'WHERE user_id = $2'
      ].join('\n'), [ new_user, old_user ], function (err) {
        if (err) return done(err);
        return updateWithdrawals();
      });
    }

    function updateWithdrawals () {
      client.query([
        'UPDATE withdrawals',
        'SET user_id = $1',
        'WHERE user_id = $2'
      ].join('\n'), [ new_user, old_user ], function (err) {
        if (err) return done(err);
        return deleteUser();
      });
    }

    function deleteUser () {
      client.query([
        'DELETE FROM users',
        'WHERE user_id = $1'
      ].join('\n'), [ old_user ], function (err) {
        if (err) return done(err);
        return done(null);
      });
    }
  }, callback);
};
