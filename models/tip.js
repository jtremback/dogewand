'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var TipSchema = new Schema({
  to_user_id: {type : Schema.ObjectId, ref : 'User'},
  from_user_id: {type : Schema.ObjectId, ref : 'User'},
  amount: Number
});