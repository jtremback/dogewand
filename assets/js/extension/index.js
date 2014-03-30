(function () {
  'use strict';

  /*global $, main_html, style_css, toolbar_html, presenters, models*/

  // = include style.css
  // = include main.html
  // = include toolbar.html
  // = include modal.html

  var templates = {
    main: main_html,
    toolbar: toolbar_html,
    modal: modal_html
  };

  // = include vendor/zepto.1.1.3.js
  // = include vendor/riot.0.9.8.js

  // = include util/ajax.js
  // = include util/jq-plugins.js
  // = include util/scrape-utils.js

  // = include models.js
  // = include presenters.js


  if ($('.dgw-dogewand').length) $('.dgw-dogewand').remove(); // remove app if exists

  $('head').append('<style>' + style_css + '</style>');

  presenters(models).main($('body'));
})();