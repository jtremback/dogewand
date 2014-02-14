'use strict';

//Dependencies
var request = require('request');
var _ = require('lodash');
var randomstring = require('randomstring');


module.exports = function(id, secret, path) {
  if (!path) path = 'https://cryptos.io/';

  var auth = {id: id, secret: secret};

  return function (type, opts, callback) {
    opts.tx_id = randomstring(32); // Some calls don't need a tx_id, who cares
    var qs = _.extend(auth, opts); // Create query string

    request({ url: path + type, qs: qs }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        if (body === 'Unauthorized') return callback({type: 'unauthorized'}); // Bad Auth
        return callback(null, body); // Success
      } else {
        return callback({type: 'api', tx_id: opts.tx_id}); // Error
      }
    });
  };
};
