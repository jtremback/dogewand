'use strict';

module.exports = function (env) {
  var nenv = process.env.NODE_ENV;

  if (nenv === 'production' || env === 'production') {

  }

  if (nenv === 'test' || env === 'test') {
    return {
      db: 'mongodb://localhost/dogewand-test',
      url: 'https://localhost:3700',
      sessionSecret: 'This is my funky secret oh my god it has ninja turtles',
      rpc: {
        rpcuser: 'dogecoinrpc',
        rpcpassword: 'XXX',
        ip: 'XXX',
        port: '1337'
      },
      facebook: {
        clientID: 'XXX',
        clientSecret: 'XXX'
      }
    };
  }

  else {
    return {
      db: 'mongodb://localhost/dogewand',
      url: 'https://localhost:3700',
      sessionSecret: 'This is my funky secret oh my god it has ninja turtles',
      rpc: {
        rpcuser: 'dogecoinrpc',
        rpcpassword: 'XXX',
        ip: 'XXX',
        port: '1337'
      },
      facebook: {
        clientID: 'XXX',
        clientSecret: 'XXX'
      }
    };
  }
};