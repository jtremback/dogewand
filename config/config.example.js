'use strict';

module.exports = function () {
  if (process.env.NODE_ENV === 'production') {
    return {
      db: 'mongodb://localhost/noobjs_dev',
      facebook: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
      }
    };
  }

  if (process.env.NODE_ENV === 'test') {
    return {
      db: 'mongodb://localhost/noobjs_dev',
      facebook: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
      }
    };
  }

  else {
    return {
      db: 'mongodb://localhost/noobjs_dev',
      facebook: {
        clientID: 'APP_ID',
        clientSecret: 'APP_SECRET',
        callbackURL: 'http://localhost:3000/auth/facebook/callback'
      }
    };
  }
};
