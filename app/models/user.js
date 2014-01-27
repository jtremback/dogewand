'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var urlTools = require('url-tools');


var UserSchema = new Schema({
  username: String,
  wallet_id: String,
  provider: String,
  sani_url: String,
  profile: {}
});

// function urlSanitize (url_str) {
//   var options = {
//     lowercase: true,
//     removeWWW: true,
//     removeTrailingSlash: true,
//     forceTrailingSlash: false,
//     removeSearch: false,
//     removeHash: true,
//     removeHashbang: true,
//     removeProtocol: true
//   };

//   return urlTools.normalize(url_str, options);
// }


// UserSchema.methods = {
//   urlSanitize: function (url) {
//     return urlSanitize(url);
//   }
// };

mongoose.model('User', UserSchema);