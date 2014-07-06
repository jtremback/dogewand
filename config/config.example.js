'use strict';

var path = require('path');

module.exports = function (env) {
  var nenv = process.env.NODE_ENV;

  if (nenv === 'test' || env === 'test') {
    return {
      db: 'pg://jehan@localhost:5432/dogewand-test',
      url: 'https://localhost:3700',
      sessionSecret: 'XXX',
      bookmarklet_version: 1,
      root: path.normalize(__dirname + '/..'),
      port: 3700,
      rpc: {
        rpcuser: 'XXX',
        rpcpassword: 'XXX',
        ip: 'XXX',
        port: 'XXX'
      },
      facebook: {
        clientID: 'XXX',
        clientSecret: 'XXX'
      },
      reddit: {
        clientID: 'XXX',
        clientSecret: 'XXX'
      }
    };
  }

  else {
    return {
      db: 'pg://jehan@localhost:5432/dogewand',
      url: 'https://localhost:3700',
      sessionSecret: 'XXX',
      bookmarklet_version: 1,
      root: path.normalize(__dirname + '/..'),
      port: 3700,
      rpc: {
        rpcuser: 'XXX',
        rpcpassword: 'XXX',
        ip: 'XXX',
        port: 'XXX'
      },
      facebook: {
        clientID: 'XXX',
        clientSecret: 'XXX'
      },
      reddit: {
        clientID: 'XXX',
        clientSecret: 'XXX'
      }
    };
  }
};
