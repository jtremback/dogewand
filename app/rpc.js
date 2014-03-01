'use strict';

//Dependencies
var request = require('request');


// init_opts = {
//   rpcuser,
//   rpcpassword,
//   ip,
//   port
// }s

module.exports = function(config) { // Saves config in scope
  return function (opts, callback) {
    var opts_str = JSON.stringify(opts);
    var url = 'http://' +
        config.rpcuser + ':' +
        config.rpcpassword + '@' +
        config.ip + ':' +
        config.port;

    request.post({
      url: url,
      body: opts_str

    }, function (error, response, body) {
      if (error) return callback(error);

      body = JSON.parse(body);
      // console.log('rpc: ', opts.method, opts.params, body.result);
      if (body.error) return callback(body.error, body);
      callback(error, body.result);
    });
  };
};

