'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipSchema = new Schema({
  tx_id: String,
  amount: Number,
  state: String,
  to_account_id: {type : Schema.ObjectId, ref : 'Account'},
  from_account_id: {type : Schema.ObjectId, ref : 'Account'}
});

mongoose.model('Tip', TipSchema);