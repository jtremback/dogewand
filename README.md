dogewand
========

This is a tipbot that works with an extension or bookmarklet.
It allows the user to use it on a social site by clicking on another user's username and choosing an amount.
Once the amount of the tip is chosen, a route is created in the server displaying the amount and an Oauth 2.0
sign in link. When another user signs in at the link with the right account, the funds are transfered to them.

This tipbot is powered by an exchange that is in alpha right now. If somebody wants to write their own dogecoin engine, I would not object using it to run the bot, but it should be in a seperate project. I'd like to keep the current api used to communicate with the engine.

I will not be adding any code to take out fees. I'd like this to be a donation supported service if we are able to get it working.

TO DO:

-* library to talk to wallet service (wallet service is a seperate project, docs upcoming)-
* finish up db code for accounts
* build routing code for tip claims
* tests
* write frontend code for extension and site

The extension can be built by running `gulp watch` in the root. Will be adding build scripts for the site as well.

---

AGPL
