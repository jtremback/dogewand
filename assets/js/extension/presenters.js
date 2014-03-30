'use strict';

/*global $, templates, scrape_utils*/

// App



function presenters (models) {

  var app = new models.App();
  var user = new models.User();

  function iframe () {
    app.on('create:tip', function (username) {
      var iframe = '<iframe width="300", height="300" src="' + app.url +
      '/app/tipper?username=' + username +
      '&provider=' + app.provider +
      '"></iframe>';
      app.trigger('show:modal', iframe);
    });
  }

  function main ($container) {
    var $contents = $(templates.main).appendTo($container);
    toolbar($('[dgw-toolbar]', $contents)); // Render toolbar into spot
    modal($contents); // Render modal into spot
    iframe(); // init iframe controller

    $container.on('click', function () {
      app.trigger('exit:tipping');
    });

    $contents.on('click', function (e) {
      e.stopPropagation();
    });

    app.on('exit:app', function () {
      $contents.remove();
    });

    app.on('enter:tipping', function () {
      $container.addClass('dgw-wand');
      var links = scrape_utils.link_finders.facebook();
      links.addAttr('dgw-link');
      links.addClass('dgw-link');

      links.on('click.dgw-link', function (e) {
        e.preventDefault();
        app.trigger('create:tip', scrape_utils.username_finders.facebook(this));
      });
    });

    app.on('exit:tipping', function () {
      $container.removeClass('dgw-wand');
      $('.dgw-link').removeClass('dgw-link'); // Just to make sure

      var links = $('[dgw-link]');
      links.removeAttr('dgw-link');
      links.off('.dgw-link');
    });

    window.addEventListener('message', function (event) { // close signal from iframe
      if (event.data === 'close') {
        app.trigger('hide:modal');
      }
    }, false);

    app.trigger('enter:tipping'); // Trigger immediately for convenience <- shouldn't be here
  }



  function toolbar ($container) {
    $container.empty();
    $(templates.toolbar).appendTo($container);


    $container.on('click', '[dgw-tip]', function () {
      app.trigger('enter:tipping');
    });

    $container.on('click', '[dgw-close]', function () {
      app.trigger('exit:app');
    });


    user.on('loaded', function (user) {
      $('[dgw-balance]', $container).html(user.balance);
    });

    user.load();
  }



  function modal ($container) {
    var $contents = $(templates.modal).appendTo($container);

    app.on('show:modal', function (body) {
      console.log('body', body)
      $contents.addClass('dgw-shown');
      $('[dgw-modal-body]').html(body);
    });

    app.on('hide:modal', function () {
      $contents.removeClass('dgw-shown');
      $('[dgw-modal-body]').html('');
    });
  }


  return {
    main: main,
    toolbar: toolbar,
    modal: modal
  };
}
