'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// var generateID = require('generateID');

var AccountSchema = new Schema({
  wallet_id: String,
  identifier: String,
  provider: String,
  profile: {}
});


AccountSchema.statics = {
  upsert: function (identifier, provider, callback) {
    var Self = this;

    Self.findOne({ identifier: identifier }, function (err, account) {
      if (err) { return callback(err); }
      if (!account) {
        account = new Self({
          wallet_id: generateID(),
          identifier: identifier,
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