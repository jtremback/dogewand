'use strict';

/*global $, templates, scrape_utils, app, iframe, append*/

function _app (container) {
  _iframe(container);
  var links;

  app.on('enter:tipping', enterTipping);

  app.on('exit:tipping', function () {
    container.classList.remove('dgw-wand');
    container.removeEventListener('click', exitTipping);

    links.forEach(function (el) {
      el.classList.remove('dgw-link');
      el.removeEventListener('click', exitTipping);
    });
  });

  app.trigger('enter:tipping'); // Trigger immediately for convenience <- shouldn't be here

  function enterTipping() {
    container.classList.add('dgw-wand');

    links = scrape_utils.link_finders.facebook();

    links.forEach(function (el) {
      el.classList.add('dgw-link');
      el.addEventListener('click', createTip);
    });

    container.addEventListener('click', exitTipping);
  }

  function createTip (e) {
    e.preventDefault();
    app.createTip(scrape_utils.username_finders.facebook(this));
  }

  function exitTipping() {
    app.trigger('exit:tipping');
  }

}



function _iframe (container) {
  var contents = append('<iframe id="dgw-frame"></iframe>', container);
  // var $contents = $('<iframe id="dgw-frame"></iframe>').appendTo($container);

  iframe.on('size', function (dimensions) {
    contents.setAttribute('width', dimensions.width);
    contents.setAttribute('height', dimensions.height);
  });

  iframe.on('navigate', function (url) {
    contents.setAttribute('src', url);
  });

  iframe.source = contents.contentWindow;
}
