'use strict';

/*global $, templates, scrape_utils, app, iframe*/

function _app ($container) {
  _iframe($container);
  var links;

  app.on('enter:tipping', function () {
    $container.addClass('dgw-wand');

    links = scrape_utils.link_finders.facebook();

    links.addAttr('dgw-link');
    links.addClass('dgw-link');

    links.on('click.dgw-tipping', function (e) {
      e.preventDefault();
      app.createTip(scrape_utils.username_finders.facebook(this));
    });

    $container.on('click.dgw-tipping', function () {
      app.trigger('exit:tipping');
    });
  });

  app.on('exit:tipping', function () {
    $container.removeClass('dgw-wand');
    $container.off('.dgw-tipping');

    links.removeClass('dgw-link');
    links.removeAttr('dgw-link');
    links.off('.dgw-tipping');
  });

  app.trigger('enter:tipping'); // Trigger immediately for convenience <- shouldn't be here
}



function _iframe ($container) {
  var $contents = $('<iframe id="dgw-frame"></iframe>').appendTo($container);

  iframe.on('size', function (dimensions) {
    $contents.attr('width', dimensions.width);
    $contents.attr('height', dimensions.height);
  });

  iframe.on('navigate', function (url) {
    $contents.attr('src', url);
  });
}
