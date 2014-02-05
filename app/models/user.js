'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var UserSchema = new Schema({
  username: String,
  wallet_id: String,
  provider: String,
  sani_url: String,
  profile: {}
});

mongoose.model('User', UserSchema);