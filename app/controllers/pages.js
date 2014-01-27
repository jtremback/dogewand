'use strict';


var mongoose = require('mongoose')
  , User = mongoose.model('User');


exports.login = function(req, res) {
  res.render('login', {});
}