Looks awesome! I could actually use some help.

There are a few major areas that need work for this to function: 

**Connection to wallet API**
I'm using a new service that is in beta for this. It handles the wallet database and cold wallets and everything so that we don't have to worry about it. I'm going to be working with them to implement this, so I won't need help on it until later.

**Site-specific heuristics and intelligence**
This is a lot like scraping. We can make good use of Zepto (lightweight jq clone). There are two main steps:

- We need to identify valid username links. It will be much better for the experience if we only turn the cursor into a wand when the user is hovering over a link that we know how to pull a username from. Youtube, for example, has many links that look like usernames, but are actually g+ redirects, channels, etc. If we don't know how to get a username from a link, we should reject it to avoid confusion when tipping doesn't work.

- We need to be able to get the username from a link. Usually the actual text of the `a` element will work well, but who knows.

These will need to be different on every site we support, so I suppose we'll need to come up with a good strategy to manage that as well. Later, if we want to get crazy, we can write some script on the serverside that actually follows the link and extracts a profile photo etc. Not essential.

**General Database**
Naive- Seperate wallet for every social media account.

account: {
  identifier: {
    provider: String,
    username: String
  }
  wallet_id: String
}

tip: {
  tx_id: String,
  amount: Number,
  state: String,
  to_account_id: {type : Schema.ObjectId, ref : 'Account'},
  from_account_id: {type : Schema.ObjectId, ref : 'Account'}
}

User signs up with social site Oauth- new `account` is created with new `wallet_id`. `username` and `provider` are stored.

Tipper leaves tip- External API is called to move `amount` to root. new `tip` is created with object_ids for both parties, amount, state is set to initial. 

Tippee claims tip- External API is called to move `amount` to tippee account. state is set to accepted.

Tipper cancels tip-  External API is called to move `amount` to tipper account. state is set to canceled.



**Design and frontend**
I'm pretty happy with the tipping flow for now, but I have not made any designs for the account admin and front page of the site. We need to map out what these will even be, and what functionality goes in the extension vs the site. (past tips, admin etc.) I'd like the site frontend and the extension to inherit from the same base stylesheet for consistency and ease. I'd like to stick with the current dark look.



**Extension packaging**
My goal here is to have all functionality coming from one js file (for easy portability to other platforms). I have mostly accomplished this with Browserify, but it could still be better. Browserify is a bit brittle and I don't like what it does to scope. Right now it is compiling and wrapping stylus and html files, which can then be required on the frontend. I'm using some custom transforms in /my_modules to do this but they are janky.

It could be done with a 2 step process like this: http://stackoverflow.com/questions/21072880/is-there-a-way-to-rewrite-the-html-to-use-gulp-minified-css/21249167#21249167, in combination with gulp-inject. The idea is to have a build step for assets like html, css, and images (images would be turned into data-uris). The js build step then watches the destination folder, and includes the processed assets with gulp-include.

This is low priority.