dogewand
========

This is a tipbot that works with an extension or bookmarklet.
It allows the user to use it on a social site by clicking on another user's username and choosing an amount.
Once the amount of the tip is chosen, a route is created in the server displaying the amount and an Oauth 2.0
sign in link. When another user signs in at the link with the right account, the funds are transfered to them.

This tipbot is powered by dogecoind. Connection credentials are placed in `config/config.js`.

The bot uses mongo, but the accounts system in dogecoind is the source of truth about account balances.
Mongo exists solely to tie accounts to social media identities. Any concerns about data consistency
can be addressed by logging on the 

Run the tests with `npm test`.



TO DO:

-* library to talk to wallet service (wallet service is a seperate project, docs upcoming)-
-* finish up db code for accounts
-* tests
* build routing code for tip claims
* write frontend code for extension and site
* security audit
* automatic wallet backup
* scaling tweaks

The extension can be built by running `gulp watch` in the root. Will be adding build scripts for the site as well.

---

AGPL
