(function () {
  'use strict';

  /*global $, main_html, style_css, toolbar_html, presenters*/
  console.log('hello.')

  // = include style.css
  // = include main.html
  // = include toolbar.html

  var templates = {
    main: main_html,
    toolbar: toolbar_html
  };

  // = include zepto.1.1.3.js
  // = include riot.0.9.8.js

  // = include jq-plugins.js
  // = include scrape-utils.js

  // = include models.js
  // = include presenters.js


  if ($('.dgw-dogewand').length) $('.dgw-dogewand').remove(); // remove app if exists

  $('head').append('<style>' + style_css + '</style>');


  presenters.main();

  app.trigger('init:main');
})();
