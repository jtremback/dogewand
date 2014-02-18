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
  upsert: function (opts, callback) {
    var Self = this;

    Self.findOne(opts, function (err, account) {
      if (err) { return callback(err); }
      if (!account) {
        account = new Self({
          wallet_id: randomstring.generate(12),
          username: opts.username,
          provider: opts.provider
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