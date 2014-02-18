'use strict';

var test = require('tape');
var mongoose = require('mongoose');
var config = require('../config/config')();
var url = require('url');
var querystring = require('querystring');
var sepia = require('sepia');
var _ = require('lodash');


// Connect to mongodb
(function () {
  var options = { server: { socketOptions: { keepAlive: 1 } }, auto_reconnect: true };
  mongoose.connect(config.db, options);
})();

require('../app/models/tip.js');
var Tip = mongoose.model('Tip');


// Set up sepia filters
sepia.filter({
  url: /account/,
  urlFilter: function(url) {
    url = url.replace(/user_id=[a-zA-Z0-9]/, '');
    url = url.replace(/secret=[a-zA-Z0-9]{64}/, '');
    return url.replace(/tx_id=[a-zA-Z0-9]{32}/, '');
  }
});


// Action
test('create', function (t) {
  t.plan(6);

  var opts = {
    from_wallet: '2is0rnd8hf4y',
    to_wallet: '2is0rnd8hf4z',
    amount: 1
  };

  Tip.create(opts, function (err, tip, response) {
    var tip_opts = _.pick(tip, ['from_wallet', 'to_wallet', 'amount']); // Get values of keys we put in

    t.equal(typeof tip.from_wallet_balance, 'number');
    t.equal(tip.state, 'created');
    t.deepEqual(tip_opts, opts);

    t.equal(response.status, 'OK');
    t.ok(_.has(response.data, 'main'), 'main wallet in response');
    t.ok(_.has(response.data, opts.from_wallet), 'from_wallet in response');

  });
});
