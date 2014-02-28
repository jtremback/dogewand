'use strict';

var async = require('async');
var _ = require('lodash');
var config = require('../../config/config')('test');
var rpc = require('../../app/rpc')(config.rpc);

exports.resetBalances = function (callback) {
  rpc({
    method: 'listaccounts',
    params: []
  }, function (err, accounts) {
    var pairs = _.pairs(accounts);

    async.each(pairs, function (pair, cb) {

      if (pair[1] === 0 || pair[0] === '') return cb(); // If account balance is 0 or account is root
      
      var params;
      if (pair[1] < 0) params = [ '', pair[0], pair[1] ]; // If balance is less than 0, move other direction
      else params = [ pair[0], '', pair[1] ]; // Otherwise move amount to root

      console.log('params', params);

      rpc({
        method: 'move',
        params: params
      }, cb);

    }, callback);
  });
};

exports.config = {
  wallet_a: '53094bd705f76eaac594158b',
  wallet_b: '530ae522f6e631e05a583196'
}