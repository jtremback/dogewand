'use strict';
var path = require('path');

module.exports = function () {
  return {
    db: 'pg://{{ secrets.postgres.name }}:{{ secrets.postgres.password }}@localhost:5432/{{ secrets.postgres.name }}',
    url: '{{ url }}',
    sessionSecret: '{{ secrets.sessionSecret }}',
    bookmarklet_version: 1,
    root: path.normalize(__dirname + '/..'),
    port: 3700,
    rpc: {
      rpcuser: '{{ secrets.dogecoin.rpcuser }}',
      rpcpassword: '{{ secrets.dogecoin.rpcpassword }}',
      ip: 'localhost',
      port: '1337'
    },
    facebook: {
      clientID: '{{ secrets.facebook.clientID }}',
      clientSecret: '{{ secrets.facebook.clientSecret }}'
    },
    youtube: {
      clientID: '{{ secrets.youtube.clientID }}',
      clientSecret: '{{ secrets.youtube.clientSecret }}'
    },
    reddit: {
      clientID: '{{ secrets.reddit.clientID }}',
      clientSecret: '{{ secrets.reddit.clientSecret }}'
    }
  };
};
