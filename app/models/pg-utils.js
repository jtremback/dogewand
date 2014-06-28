'use strict';

var pg = require('pg');

module.exports = function (connection_string) {
  var ret = {};

  ret.transaction = function (callback, hollaback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return hollaback(err);

      function rollback (err) {
        client.query('ROLLBACK', function(error) {
          done(error || err);
          return hollaback(error || err);
        });
      }

      var augmentedDone = function (err) {
        if (err) return rollback(err);
        client.query(
          'COMMIT;',
        function (err) {
          if (err) return rollback(err);
          done();
          return hollaback.apply(this, arguments);
        });
      };

      client.query(
        'BEGIN;',
      function (err) {
        if (err) return augmentedDone(err);
        callback(client, augmentedDone);
      });
    });
  };

  ret.query = function (callback, hollaback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return hollaback(err);

      var augmentedDone = function (err) {
        done(err);
        return hollaback.apply(this, arguments);
      };

      callback(client, augmentedDone);
    });
  };

  return ret;
};
