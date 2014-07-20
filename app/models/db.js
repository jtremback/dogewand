'use strict';

var config = require('../../config/config')();
var pgutils = require('./pg-utils')(config.db);
var rpc = require('./rpc')(config.rpc);
var pg = require('pg');
var fs = require('fs');
var _ = require('lodash');

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
    'SELECT',
      'users.user_id,',
      'users.balance,',
      'users.username,',
      'users.created_at,',
      'accounts.account_id,',
      'accounts.provider account_provider,',
      'accounts.uniqid account_uniqid,',
      'accounts.display_name account_display_name,',
      'accounts.created_at account_created_at',
    'FROM users',
    'INNER JOIN accounts ON accounts.user_id = users.user_id',
    'WHERE users.user_id = $1',
  ].join('\n'), [ user_id ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);

    var user = {
      user_id: result.rows[0].user_id,
      balance: Math.floor(result.rows[0].balance),
      username: result.rows[0].username,
      created_at: result.rows[0].created_at
    };

    var accounts = result.rows.map(function (item) {
      return {
        account_id: item.account_id,
        uniqid: item.account_uniqid,
        provider: item.account_provider,
        display_name: item.account_display_name,
        created_at: item.account_created_at
      };
    });

    user.accounts = accounts;
    return callback(null, user);
  });
};


// exports.getProvidersByUsername = function () {

// }

exports.checkUsername = function (username, callback) {
  pgutils.query([
    'SELECT',
    'FROM users',
    'WHERE username = $1'
  ].join('\n'), [ username ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);
    return callback(null, true);
  });
};


exports.addUsername = function (username, user_id, callback) {
  pgutils.query([
    'UPDATE users',
    'SET username = $1',
    'WHERE user_id = $2'
  ].join('\n'), [ username, user_id ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);
    return callback(null, true);
  });
};


exports.getAccount = function (uniqid, provider, callback) {
  pgutils.transaction(function (client, done) {
    var account = {};

    client.query([
      'SELECT * from accounts',
      'WHERE uniqid && $1',
      'AND provider = $2'
    ].join('\n'), [ [ uniqid ], provider ], function (err, result) {
      if (err || !result.rows[0]) return done(err, null);
      account = result.rows[0];
      return countSiblings(result.rows[0].user_id);
    });

    function countSiblings (user_id) {
      client.query([
        'SELECT count(true) from accounts',
        'WHERE user_id = $1'
      ].join('\n'), [ user_id ], function (err, result) {
        if (err || !result.rows[0]) return done(err, null);
        account.siblings = Math.floor(result.rows[0].count) > 2;
        return done(null, account);
      });
    }
  }, callback);
};


exports.createTip = function (user_id, account_id, opts, callback) {
  pgutils.transaction(function (client, done) {

    client.query([ // Get or insert account for tippee
      'SELECT * FROM accountInsertOrSelect($1, $2, $3)',
      'AS (account_id int, user_id int, uniqid text[], provider text, display_name text, created_at timestamp)'
    ].join('\n'), [ opts.uniqid, opts.provider, opts.display_name ], function (err, result) {
      if (err || !result.rows[0]) return done(err, null);
      return insertTip(result.rows[0].account_id);
    });

    function insertTip (tippee_account_id) {
      client.query([
        'INSERT INTO tips (tipper_account_id, tippee_account_id, amount)',
        'VALUES ($1, $2, $3)',
        'RETURNING *;'
      ].join('\n'), [ account_id, tippee_account_id, opts.amount ], function (err, result) {
        if (err || !result.rows[0]) return done(err, null);
        return updateBalance(result.rows[0].tip_id);
      });
    }

    function updateBalance (tip_id) {
      client.query([
        'UPDATE users SET balance = balance - $1',
        'WHERE user_id = $2 RETURNING *'
      ].join('\n'), [ opts.amount, user_id ], function (err, result) {
        if (err || !result.rows[0]) return done(err, null);
        return done(null, Math.floor(result.rows[0].balance), tip_id);
      });
    }
  }, callback);
};


exports.resolveTip = function (user_id, tip_id, callback) {
  pgutils.transaction(function (client, done) {
    client.query([
      'UPDATE tips t',
      'SET state = CASE WHEN t.tippee_account_id = a.account_id THEN \'claimed\'::tip_state',
                      'WHEN t.tipper_account_id = a.account_id THEN \'canceled\'::tip_state',
                      'END',
      'FROM accounts a WHERE user_id = $1 AND tip_id = $2 AND state = \'created\'::tip_state',
      'AND (t.tippee_account_id = a.account_id OR t.tipper_account_id = a.account_id)',
      'RETURNING *;'
    ].join('\n'), [ user_id, tip_id ], function (err, result) {
      if (err || !result.rows[0]) return done(err, null);
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
        if (err || !result.rows[0]) return done(err, null);
        return done(null, Math.floor(result.rows[0].balance));
      });
    }
  }, callback);
};


var tip_aliases =
 ['tipper.display_name tipper_display_name,',
  'tippee.display_name tippee_display_name,',
  'tipper.provider tipper_provider,',
  'tippee.provider tippee_provider,',
  'tipper.uniqid tipper_uniqid,',
  'tippee.uniqid tippee_uniqid,',
  'tipper.user_id tipper_user_id,',
  'tippee.user_id tippee_user_id,',
  'tips.tippee_account_id,',
  'tips.tipper_account_id,',
  'tips.state,',
  'tips.amount,',
  'tips.created_at,',
  'tips.tip_id'].join('\n');


function tipObject (rows) {
  return rows.map(function (item) {
    return {
      amount: Math.floor(item.amount),
      state: item.state,
      tip_id: item.tip_id,
      created_at: item.created_at,
      tipper: {
        uniqid: item.tipper_uniqid,
        provider: item.tipper_provider,
        display_name: item.tipper_display_name,
        account_id: item.tipper_account_id
      },
      tippee: {
        uniqid: item.tippee_uniqid,
        provider: item.tippee_provider,
        display_name: item.tippee_display_name,
        account_id: item.tippee_account_id
      }
    };
  });
}


exports.getTip = function (tip_id, callback) {
  pgutils.query([
    'SELECT',
      tip_aliases,
    'FROM tips',
    'INNER JOIN accounts tipper ON tipper.account_id = tips.tipper_account_id',
    'INNER JOIN accounts tippee ON tippee.account_id = tips.tippee_account_id',
    'WHERE tip_id = $1'
  ].join('\n'), [ tip_id ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);

    return callback(null, tipObject(result.rows)[0]);
  });
};


exports.getUserTips = function (user_id, callback) {
  pgutils.query([
    'SELECT',
      tip_aliases,
    'FROM tips',
    'INNER JOIN accounts tipper ON tipper.account_id = tips.tipper_account_id',
    'INNER JOIN accounts tippee ON tippee.account_id = tips.tippee_account_id',
    'WHERE tipper.user_id = $1 OR tippee.user_id = $1',
    'ORDER BY tips.created_at DESC'
  ].join('\n'), [ user_id ], function (err, result) {
    if (err || !result.rows[0]) return callback(err, null);

    return callback(null, tipObject(result.rows));
  }, callback);
};


exports.getAddress = function (user_id, callback) {
  pgutils.transaction(function (client, done) {
    client.query([
      'SELECT * FROM user_addresses',
      'WHERE user_id = $1;'
    ].join('\n'), [ user_id ], function (err, result) {
      if (err) return done(err, null);
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
      if (err || !result.rows[0]) return done(err, null);
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
        if (err || !result.rows[0]) return done(err, null);
        result.rows[0].amount = Math.floor(result.rows[0].amount);
        return done(null, new_balance, result.rows[0]);
      });
    }
  }, callback);
};


exports.auth = function (opts, callback) {
  pgutils.transaction(function (client, done) {

    client.query([
      'SELECT * FROM accountInsertOrUpdate($1, $2, $3)',
      'AS (account_id int, user_id int, uniqid text[], provider text, display_name text, created_at timestamp)'
    ].join('\n'), [ opts.uniqid, opts.provider, opts.display_name ], function (err, result) {
      if (err || !result.rows[0]) return done(err, null);
      var user = result.rows[0];
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
        if (err || !result.rows[0]) return done(err, null);
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
