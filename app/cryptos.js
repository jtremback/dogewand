'use strict';

//Dependencies
var request = require('request');
var _ = require('lodash');
var ObjectID = require('mongodb').ObjectID;


// * tx_id is a random string nonce of 32 characters that identifies a single request.
//   You can send multiple requests with the same tx_id, and it will only go through once, so
//   you can do retries safely when there is a network problem.
//   NOTE: tx_id does not guarantee that a request will successfully go through,
//   it only guarantees that the server will only see it once. If the server crashes while
//   processing a request of a given tx_id, you may have to make another request with
//   a new tx_id.
// * Make sure your wallet names are exactly 12 characters long.
// * <coin> is ‘BTC’, ‘DOG’, etc.
// * All requests must additionally include ‘user_id’ and ‘secret’ parameters.
 
// /account/balance            {wallet:<wallet>} ->                              {status:”OK”, data:{<wallet>:{<coin>:<amount_in_satoshis>}}}
// /account/deposit_address    {wallet:<wallet>, coin:<coin>} ->                 {status:”OK”, data:<address_string>}
// /account/deposits           {address:<address>} ->                            {status:”OK”, data:[<payment1>,…]}
// /account/move               {from_wallet, to_wallet, coin, amount, tx_id}   {status:”OK”, data:{<from_wallet>:{<coin>:<amount_in_satoshis>},<to_wallet>:…}}
// /account/withdraw           {from_wallet, to_address, coin, amount, tx_id}  {status:”OK”, data:{<from_wallet>:{<coin>:<amount_in_satoshis>}}}
// /account/withdrawals        {coin:<coin>} ->                                  {status:”OK”, data:[<withdrawal1>,…]}

// 530056d795292a00000431ab00000000

module.exports = function(init_opts) {
  // if (!path) path = 'https://cryptos.io/account/';

  // var auth = { 
  //   user_id: init_opts.user_id,
  //   secret: init_opts.secret
  // };

  return function (type, opts, callback) {
    opts.tx_id = (type === 'move' || type === 'withdraw') ? new ObjectID() + '00000000' : false; // Create tx_id as padded oid or set false

    var qs = _.assign(_.omit(init_opts, 'path'), opts);

    // var qs = _.extend(auth, opts); // Create query string



    // console.log(init_opts.path + type + JSON.stringify(qs));

    request({ url: init_opts.path + type, qs: qs }, function (error, response, body) {
      body = JSON.parse(body);

      if (error) return callback(error, body.data, opts.tx_id); // Bad URL
      if (body === 'Unauthorized') return callback({ type: 'unauthorized' }, body.data, opts.tx_id); // Bad Auth

      if (body.status === 'ERROR' &&
          body.data.match(/negative balance for wallet/)) return callback({ type: 'broke' }, body.data, opts.tx_id); // Broke
      
      if (body.status === 'OK') return callback(null, body, opts.tx_id); // Success
      return callback({ type: 'other'}, body, opts.tx_id); // Other Error
    });
  };

};
