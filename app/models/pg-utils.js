'use strict';

var pg = require('pg');

module.exports = function (connection_string) {
  var ret;

  ret.dbTransaction = function (callback, hollaback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      var methods = {
        done: done
      };

      methods.error = function (err) {
        client.query('ROLLBACK', function(error) {
          console.log('ROLLBACK');
          done(error || err);
          return callback(error || err);
        });
      };

      methods.commit = function () {
        client.query(
          'COMMIT;',
        function (err) {
          if (err) return methods.error(err);
          done();
          return callback.apply(arguments);
        });
      };

      client.query(
        'BEGIN;',
      function (err) {
        if (err) return methods.error(err);
        hollaback(client, methods);
      });
    });
  };

  ret.dbQuery = function (callback, hollaback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      var methods = {
        done: done
      };

      methods.error = function (err) {
        done(err);
        return callback(err);
      };

      hollaback(client, methods);
    });
  };

  return ret;
}
