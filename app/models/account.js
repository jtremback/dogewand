'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var randomstring = require('randomstring');

var AccountSchema = new Schema({
  wallet_id: String,
  username: String,
  provider: String,
  profile: {}
});


AccountSchema.statics = {
  upsert: function (username, provider, callback) {
    var Self = this;

    Self.findOne({ username: username }, function (err, account) {
      if (err) { return callback(err); }
      if (!account) {
        account = new Self({
          wallet_id: randomstring.generate(12),
          username: username,
          provider: provider
        });
        account.save(function (err) {
          if (err) console.log(err);
          return callback(err, account);
        });
      }
      else {
        console.log(account);
        return callback(err, account);
      }
    });
  }
};


mongoose.model('Account', AccountSchema);