'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipSchema = new Schema({
  to_account_id: {type : Schema.ObjectId, ref : 'Account'},
  from_account_id: {type : Schema.ObjectId, ref : 'Account'},
  amount: Number
});

mongoose.model('Tip', TipSchema);