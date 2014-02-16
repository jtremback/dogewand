'use strict';

module.exports = function () {
  if (process.env.NODE_ENV === 'production') {

  }

  if (process.env.NODE_ENV === 'test') {

  }

  else {
    return {
      db: 'mongodb://localhost/noobjs_dev',
      url: 'https://localhost:3700',
      sessionSecret: 'This is my funky secret oh my god it has ninja turtles',
      cryptos: {
        path: 'https://cryptos.io/account/',
        user_id: 'ID',
        secret: 'SECRET',
        coin: 'DOG'
      },
      facebook: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET'
      }
    };
  }
};
