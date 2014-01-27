'use strict';


var mongoose = require('mongoose')
  , User = mongoose.model('User')
  , bookmarklet = require('./bookmarklet-loader');


exports.login = function(req, res) {
  console.log(bookmarklet)
  res.render('login', {
    bookmarklet: bookmarklet
  });
};