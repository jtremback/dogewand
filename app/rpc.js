'use strict';

//Dependencies
var request = require('request');
var _ = require('lodash');


// init_opts = {
//   rpcuser,
//   rpcpassword,
//   ip,
//   port
// }s

module.exports = function(config) { // Saves config in scope
  return function (body, callback) {
    var body = JSON.stringify(body);
    var url = 'http://' +
        config.rpcuser + ':' +
        config.rpcpassword + '@' +
        config.ip + ':' +
        config.port;

    request.post({
      url: url,
      body: body

    }, function (error, response, body) {
      console.log(body)
      if (error) return callback(error);
      
      body = JSON.parse(body);
      if (body.error) return callback(body.error);
      callback(error, body);
    });
  };
};

