dogewand
========

This is a tipbot that works with an extension or bookmarklet.
It allows the user to use it on a social site by clicking on another user's username and choosing an amount.
Once the amount of the tip is chosen, a route is created in the server displaying the amount and an Oauth 2.0
sign in link. When another user signs in at the link with the right account, the funds are transfered to them.

TO DO:

* library to talk to wallet service (wallet service is a seperate project, docs upcoming)
* finish up db code for accounts
* build routing code for tip claims
* tests
* write frontend code for extension and site

The extension can be built by running `gulp watch` in the root. Will be adding build scripts for the site as well.

---

The MIT License (MIT)

Copyright (c) 2014 Jehan Tremback

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
