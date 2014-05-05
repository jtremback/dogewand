dogewand
========

This is a tipbot that works with an extension or bookmarklet.
It allows the user to use it on a social site by clicking on another user's username and choosing an amount.
Once the amount of the tip is chosen, a route is created in the server displaying the amount and an Oauth 2.0
sign in link. When another user signs in at the link with the right account, the funds are transfered to them.

This tipbot is powered by dogecoind. Connection credentials are placed in `config/config.js`.

The bot uses mongo, but the accounts system in dogecoind is the source of truth about account balances.
Mongo exists solely to tie accounts to social media identities. This may need to change in the future to scale.


Run the tests with `npm test`.



TO DO:

* write frontend code for extension and site
* security audit
* automatic wallet backup
* scaling tweaks

The extension can be built by running `gulp build`, and then 'gulp watch' in the root. I will be adding build scripts for the site as well.

###Server API:

* GET /iframe - returns iframe app html
* GET /api/account - returns account info
* GET /api/tips - get list of tips for account
* POST /api/tips/create - creates tip
  username
  provider
  amount
* POST /api/tips/resolve - resolves tip
  tip_id
* POST /api/account/withdraw - sends to address
  to_address
  amount
* GET /api/account/address - returns address linked to current acct.

####Server responses:
Status: Number

    {
      'status': Number,
      'error': Boolean,
      'data': Anything
    }

###postMessage API:

####iframe -> loader:

    { "method": "enter.tipping" } // enters tipping mode

    { "method": "exit" } // exits everything

    { "method": "size", // sets size of iframe
      "data": {
        "width": Css,
        "height": Css,
      }
    }

####loader -> iframe
    { "method": "create.tip"
      "data": {
        "username": String,
        "provider": String
      }
    }





---

AGPL
