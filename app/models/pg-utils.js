'use strict';

var pg = require('pg');

module.exports = function (connection_string) {
  var pgutils = {};

  pgutils.transaction = function (queryLogic, callback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      // var begin_time = Date.now();

      function rollback (err) {
        console.log(err, callback);
        client.query('ROLLBACK', function(error) {
          done(error || err); // log error in rollback or error in commit
          return callback(error || err);
        });
      }

      var augmentedDone = function (err) {
        if (err) return rollback(err); // Pass error in for logging later
        var _arguments = arguments;
        client.query(
          'COMMIT;',
        function (err) {
          if (err) return rollback(err);
          done();
          // console.log('transaction done', Date.now() - begin_time);
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

  pgutils.queries = function (queryLogic, callback) {
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      var begin_time = Date.now();

      var augmentedDone = function (err) {
        done(err);
        // console.log('query done', Date.now() - begin_time);
        return callback.apply(this, arguments);
      };

      queryLogic(client, augmentedDone);
    });
  };

  pgutils.query = function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var callback = args.pop();
    pg.connect(connection_string, function (err, client, done) {
      if (err) return callback(err);

      var begin_time = Date.now();

      var augmentedDone = function (err) {
        done(err);
        // console.log('query done', Date.now() - begin_time);
        return callback.apply(this, arguments);
      };

      args.push(augmentedDone);

      if (args.length === 3) return client.query(args[0], args[1], args[2]); // For some reason apply doesnt work here
      if (args.length === 2) return client.query(args[0], args[1]);
    });
  };

  return pgutils;
};
