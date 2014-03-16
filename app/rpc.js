'use strict';

//Dependencies
var request = require('request');
var elapse = require('elapse');

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

    elapse.time('request.post' + opts_str);

    request.post({
      url: url,
      body: opts_str

    }, function (error, response, body) {
      elapse.timeEnd('request.post' + opts_str);
      if (error) return callback(error);

      body = JSON.parse(body);
      console.log('rpc returns: ', JSON.stringify(body.result).substring(0, 420));
      if (body.error) return callback(body.error, body);
      callback(error, body.result);
    });
  };
};

