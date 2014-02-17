dogewand
========

This is a tipbot that works with an extension or bookmarklet.
It allows the user to use it on a social site by clicking on another user's username and choosing an amount.
Once the amount of the tip is chosen, a route is created in the server displaying the amount and an Oauth 2.0
sign in link. When another user signs in at the link with the right account, the funds are transfered to them.

## Installation
Run the ```INSTALL``` script in the ```/bin``` directory.

This will install any required Node modules before running the server.

### Windows & Linux
```sh bin/INSTALL```

---

TO DO:

* library to talk to wallet service (wallet service is a seperate project, docs upcoming)
* finish up db code for accounts
* build routing code for tip claims
* tests
* write frontend code for extension and site

The extension can be built by running `gulp watch` in the root. Will be adding build scripts for the site as well.

---

AGPL
