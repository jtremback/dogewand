(function () {
  'use strict';

  /*global $, main_html, style_css, toolbar_html, presenters, models*/

  function providerFinder (host) {
    var cleaned = host
    .split("").reverse().join("")
    .match(/^([^\.]*\.[^\.]*).*$/)[1]
    .split("").reverse().join(""); // Double reverse string for regexing

    switch (cleaned) {
      case 'facebook.com':
        return 'facebook';
      case 'localhost:3700':
        return 'localhost';
      default:
        return false;
    }
  }

  var URL = '<%= url %>';
  var VERSION = 1; // If this is not consistent with the server's version, the user will get an update modal!
  var PROVIDER = providerFinder(window.location.host);

  if ($('.dgw-frame').length) $('.dgw-frame').remove(); // remove app if exists

  $('head').append('<style dgw-styles="dgw-styles">' + style_css + '</style>'); // add style to header


  var app = new App();
  var iframe = new Iframe();

  _app($('body')); // Presenters are denoted with _

  iframe.trigger('navigate', URL + '/iframe');
})();