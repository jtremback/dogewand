(function () {
  'use strict';

  /*global $, main_html, style_css, toolbar_html, presenters, models*/

  function $ (selector, el) {
    if (!el) {el = document;}
    return el.querySelector(selector);
  }

  function $_ (selector, el) {
    if (!el) {el = document;}
    return Array.prototype.slice.call(el.querySelectorAll(selector));
  }

  function append ( el_string, parent ) {
    var div = document.createElement( 'div' );
    div.innerHTML = el_string;
    var el = div.firstChild;
    return parent.appendChild(el);
  }

  // = include('style.css')

  // = include('vendor/riot.1.0.1.js')
  // = include('vendor/classList.js')

  // = include('util/scrape-utils.js')

  // = include('app/models.js')
  // = include('app/presenters.js')


  function providerFinder (host) {
    var cleaned = host
    .split("").reverse().join("")
    .match(/^([^\.]*\.[^\.]*).*$/)[1]
    .split("").reverse().join(""); // Double reverse string for regexing

    switch (cleaned) {
      case 'facebook.com':
        return 'Facebook';
      case 'youtube.com':
        return 'Youtube';
      default:
        return false;
    }
  }

  var URL = '<%= url %>';
  var VERSION = 1; // If this is not consistent with the server's version, the user will get an update modal!
  var PROVIDER = providerFinder(window.location.host);

  var dgw_frame = $('.dgw-frame');
  if (dgw_frame && dgw_frame.tagName) dgw_frame.remove(); // remove app if exists

  append('<style dgw-styles="dgw-styles">' + style_css + '</style>', $('body')); // add style to head

  var app = new App();
  var iframe = new Iframe();

  _app($('body')); // Presenters are denoted with _

  iframe.trigger('navigate', URL + '/iframe');
})();