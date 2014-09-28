'use strict';
var path = require('path');

module.exports = {
  db: process.env.LOCAL_DB || process.env.HEROKU_POSTGRESQL_ONYX_URL,
  url: process.env.URL,
  sessionSecret: process.env.SESSION_SECRET,
  bookmarklet_version: 1,
  root: path.normalize(__dirname + '/..'),
  port: process.env.PORT,
  block_io: {
    api_key: process.env.BLOCK_IO_KEY,
    secret: process.env.BLOCK_IO_SECRET
  },
  facebook: {
    clientID: process.env.FB_ID,
    clientSecret: process.env.FB_SECRET
  },
  youtube: {
    clientID: process.env.YOUTUBE_ID,
    clientSecret: process.env.YOUTUBE_SECRET
  },
  reddit: {
    clientID: process.env.REDDIT_ID,
    clientSecret: process.env.REDDIT_SECRET
  }
};

