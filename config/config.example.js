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
        id: 'ID',
        secret: 'SECRET'
      },
      facebook: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET'
      }
    };
  }
};
