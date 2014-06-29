'use strict';

var pg = require('pg');

module.exports = function (connection_string) {
  var ret = {};

  ret.transaction = function (queryLogic, callback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      function rollback (err) {
        client.query('ROLLBACK', function(error) {
          done(error || err);
          return callback(error || err);
        });
      }

      var augmentedDone = function (err) {
        if (err) return rollback(err);
        var _arguments = arguments;
        client.query(
          'COMMIT;',
        function (err) {
          if (err) return rollback(err);
          done();
          return callback.apply(this, _arguments);
        });
      };

      client.query(
        'BEGIN;',
      function (err) {
        if (err) return augmentedDone(err);
        queryLogic(client, augmentedDone);
      });
    });
  };

  ret.queries = function (queryLogic, callback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      var augmentedDone = function (err) {
        done(err);
        return callback.apply(this, arguments);
      };

      queryLogic(client, augmentedDone);
    });
  };

  ret.query = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var callback = args.pop();
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      var augmentedDone = function (err) {
        done(err);
        return callback.apply(this, arguments);
      };

      args.push(augmentedDone);

      if (args.length === 3) return client.query(args[0], args[1], args[2]); // For some reason apply doesnt work here
      if (args.length === 2) return client.query(args[0], args[1]);
    });
  };

  return ret;
};
