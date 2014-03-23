'use strict';

/*global $, models, templates, scrape_utils*/

// App
var app = new models.App();
var user = new models.User();

var presenters = {

  main: function () {
    var contents = $(templates.main).appendTo('body');
    presenters.toolbar($('[dgw-toolbar]', contents)); // Render toolbar into spot

    $('body').on('click', function () {
      app.trigger('exit:tipping');
    });

    $('[dgw-dogewand]').on('click', function (e) {
      e.stopPropagation();
    });

    app.on('exit:app', function () {
      contents.remove();
    });

    app.on('enter:tipping', function () {
      $('body').addClass('dgw-wand');
      var links = scrape_utils.link_finders.facebook();
      links.addAttr('dgw-link');
      links.addClass('dgw-link');

      links.on('click.dgw-link', function (e) {
        e.preventDefault();
        app.trigger('create:tip', scrape_utils.username_finders.facebook(this));
      });
    });

    app.on('exit:tipping', function () {
      $('body').removeClass('dgw-wand');
      $('.dgw-link').removeClass('dgw-link'); // Just to make sure

      var links = $('[dgw-link]');
      links.removeAttr('dgw-link');
      links.off('.dgw-link');
    });

    app.trigger('enter:tipping'); // Trigger immediately for convenience
  }

  ,

  toolbar: function (container) {
    var contents = container.html($.render(templates.toolbar, user.data));

    console.log(contents);

    $(contents).on('click', '[dgw-tip]', function () {
      app.trigger('enter:tipping');
    });

    $(contents).on('click', '[dgw-close]', function () {
      app.trigger('exit:app');
    });


    user.on('loaded', function (user) {
      console.log(user.balance, contents);
      $('[dgw-balance]', contents).html(user.balance);
    });

    user.load();
    app.trigger('enter:tipping'); // Enter tipping mode immediately for convenience
  }

  // ,

  // tipper: function (balance) {
  //   var contents;
  //   var tipper = new models.Tipper;

  //   function uiHandlers () {

  //   }

  //   tipper.on('new:tip', function (tip) {

  //   });

  //   tipper.on('new:balance', function (balance) {

  //   });
  // }



  // modal: function (template) {
  //   var contents;

  //   app.on('modal', )
  // }

};