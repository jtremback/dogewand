'use strict';

var pg = require('pg');
var fs = require('fs');
var config = require('../config/config')();

pg.defaults.database = 'dogewand';

pg.connect(function (err, client, done) {
  client.query(fs.readFileSync(config.root + '/app/functions.sql'), function (err, result) {
    done(err);
  });
});

// Need to have same provider as
exports.createTip = function (user_id, account_id, opts, callback) {
  pg.connect(function (err, client, done) {
    if (err) return callback(err);

    function error (err) {
      client.query('ROLLBACK', function(error) {
        done(error || err);
        return callback(error || err);
      });
    }

    client.query(
    'BEGIN;',
    function (err) {
      if (err) return error(err);
      getTippee();
    });

    function getTippee () {
      client.query(
        ['SELECT * FROM accountInsertOrSelect($1, $2, $3)',
        'AS (account_id int, user_id int, uniqid text, provider text, display_name text)'].join('\n'),
        [ opts.uniqid, opts.provider, opts.display_name ],
      function (err, result) {
        if (err) return error(err);
        insertTip(result.rows[0].account_id);
      });
    }

    function insertTip (tippee_id) {
      client.query(
        ['INSERT INTO tips (tipper_id, tippee_id, amount)',
        'VALUES ($1, $2, $3)',
        'RETURNING *;'].join('\n'),
        [ account_id, tippee_id, opts.amount ],
      function (err, result) {
        if (err) return error(err);
        updateBalance(result.rows[0].tip_id);
      });
    }

    function updateBalance (tip_id) {
      client.query(
        'UPDATE users SET balance = balance - $1 WHERE user_id = $2 RETURNING *',
        [ opts.amount, user_id ],
      function (err, result) {
        if (err) return error(err);
        commit(result.rows[0].balance, tip_id);
      });
    }

    function commit (balance, tip_id) {
      client.query(
      'COMMIT;',
      function (err) {
        if (err) return error(err);
        done();
        return callback(null, {
          tip_id: tip_id,
          balance: balance
        });
      });
    }
  });
};



exports.resolveTip = function (tip_id, user_id, callback) {
  pg.connect(function (err, client, done) {
    if (err) return callback(err);

    function error (err) {
      client.query('ROLLBACK', function(error) {
        console.log('ROLLBACK');
        done(error || err);
        return callback(error || err);
      });
    }

    client.query(
      'BEGIN;',
    function (err) {
      if (err) return error(err);
      updateTip();
    });

    function updateTip () {
      client.query(
        ['UPDATE tips t',
        'SET state = CASE WHEN t.tippee_id = a.account_id THEN \'claimed\'::tip_state',
                        'WHEN t.tipper_id = a.account_id THEN \'canceled\'::tip_state',
                        'END',
        'FROM accounts a WHERE user_id = $1 AND tip_id = $2 AND state = \'created\'::tip_state',
        'AND (t.tippee_id = a.account_id OR t.tipper_id = a.account_id)',
        'RETURNING *;'].join('\n'),
        [ user_id, tip_id ],
      function (err, result) {
        if (err) return error(err);
        if (!result.rowCount) return error(new Error('Resolve Error'));
        updateBalance(result.rows[0].amount);
      });
    }

    function updateBalance (amount) {
      client.query(
        ['UPDATE users',
        'SET balance = balance + $1',
        'WHERE user_id = $2',
        'RETURNING balance;'].join('\n'),
        [ amount, user_id ],
      function (err, result) {
        if (err) return error(err);
        return commit(result.rows[0]);
      });
    }

    function commit (result) {
      client.query(
        'COMMIT;',
      function (err) {
        if (err) return error(err);
        done();
        return callback(null, result);
      });
    }
  });
};



exports.addDeposit = function (opts, callback) {
  pg.connect(function (err, client, done) {
    if (err) return callback(err);

    function error (err) {
      done(err);
      return callback(err);
    }

    var amount = Math.floor(opts.amount);

    client.query(
    ['INSERT INTO deposits (txid, address, amount)',
    'VALUES ($1, $2, $3)'].join('\n'),
    [ opts.txid, opts.address, amount ],
    function (err) {
      if (!err) {
        return updateBalance(amount, opts.address);
      }
      else if (err.code === '23505') { // If it is a unique key violation (very normal)
        done();
        return callback(null);
      }
      else {
        return error(err);
      }
    });

    function updateBalance (amount, address) {
      client.query(
      ['UPDATE users',
      'SET balance = balance + $1',
      'WHERE user_id = (',
        'SELECT user_id FROM addresses',
        'WHERE address = $2)'].join('\n'),
      [ amount, address ],
      function (err) {
        if (err) return error(err);
        done();
        return callback(null);
      });
    }

  });
};



exports.auth = function (opts, callback) {
  pg.connect(function (err, client, done) {
    if (err) return callback(err);

    function error (err) {
      done(err);
      return callback(err);
    }

    client.query(
    // We get the account, if it does not exist, we make it, we overwrite the display_name
    ['SELECT * FROM accountinsertorupdate($1, $2, $3)',
    'AS (account_id int, user_id int, uniqid text, provider text, display_name text)'].join('\n'),
    [ opts.uniqid, opts.provider, opts.display_name ],
    function (err, result) {
      if (err) return error(err);
      var row = result.rows[0];
      if (!row.user_id) return insertUser(row.account_id); // If the account does not have a user make one
      return joinAccounts(row.user_id);
    });

    function insertUser (account_id) {
      client.query(
      ['WITH u AS (',
        'INSERT INTO users (balance)',
        'VALUES (0)',
        'RETURNING user_id)',
      'UPDATE accounts',
      'SET user_id = (SELECT user_id FROM u)',
      'WHERE account_id = $1',
      'RETURNING user_id'].join('\n'),
      [ account_id ],
      function (err, result) {
        if (err) return error(err);
        var row = result.rows[0];
        return joinAccounts(row.user_id);
      });
    }

    function joinAccounts (user_id) {
      client.query(
      ['SELECT * FROM users',
      'INNER JOIN accounts ON accounts.user_id = users.user_id',
      'WHERE users.user_id=$1;'].join('\n'),
      [ user_id ],
      function (err, result) {
        if (err) return error(err);
        done();
        var user = {
          user_id: result.rows[0].user_id,
          balance: result.rows[0].balance
        };
        var accounts = result.rows.map(function (item) {
          item.user_id = undefined;
          item.balance = undefined;
          return item;
        });
        user.accounts = accounts;
        return callback(null, user);
      });
    }
  });
};



exports.mergeUsers = function (new_user, current_user, callback) {
  pg.connect(function (err, client, done) {
    if (err) return callback(err);

    function error (err) {
      done(err);
      return callback(err);
    }

    client.query(
    ['UPDATE accounts',
    'SET user_id = $1',
    'WHERE user_id = $2'].join('\n'),
    [ new_user, current_user ],
    function (err, result) {
      if (err) return error(err);
      done();
      callback(result);
    });

  });
};



exports.mergeUsers = function (new_user, current_user, callback) {
  pg.connect(function (err, client, done) {
    if (err) return callback(err);

    function error (err) {
      client.query('ROLLBACK', function(error) {
        console.log('ROLLBACK');
        done(error || err);
        return callback(error || err);
      });
    }

    client.query(
      'BEGIN;',
    function (err) {
      if (err) return error(err);
      updateAccounts();
    });

    function updateAccounts () {
      client.query(
      ['UPDATE accounts',
      'SET user_id = $1',
      'WHERE user_id = $2',
      'RETURNING *'].join('\n'),
      [ new_user, current_user ],
      function (err) {
        if (err) return error(err);
        done();
        updateAddresses();
      });
    }

    function updateAddresses () {
      client.query(
      ['UPDATE addresses',
      'SET user_id = $1',
      'WHERE user_id = $2',
      'RETURNING *'].join('\n'),
      [ new_user, current_user ],
      function (err) {
        if (err) return error(err);
        done();
        commit();
      });
    }

    function commit () {
      client.query(
        'COMMIT;',
      function (err) {
        if (err) return error(err);
        done();
        return callback(null);
      });
    }
  });
};
