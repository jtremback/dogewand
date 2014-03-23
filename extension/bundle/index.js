'use strict';

/*global $, main_html, style_css, toolbar_html*/
console.log('hello.')

// = include style.css
// = include main.html
// = include toolbar.html

// = include zepto.1.1.3.js
// = include riot.0.9.8.js


$.fn.addAttr = function(attr) {
  this.attr(attr, attr);
  return this;
};


// Models
var models = {

  App: function () {
    var self = $.observable(this);
    self.mode = {};

    self.host = window.location.host.match(/^.*\.(.*)\.(.*)$/)[1];

    self.on('enter:tipping', function () {
      self.mode.tipping = true;
    });

    self.on('exit:tipping', function () {
      self.mode.tipping = false;
    });
  }

  ,

  // Tipper: function (balance) {
  //   var self = $.observable(this);

  //   var tip;

  //   self.calc = function (opts) {
  //     var new_balance;

  //     if (opts.balance) {
  //       tip = balance - opts.balance;
  //       if (tip < 0) {
  //         tip = balance; // Empty account
  //       }

  //       self.trigger('new:tip', tip);
  //     }

  //     if (opts.tip) {
  //       var new_balance = balance - opts.tip; // If it goes negative
  //       if (new_balance < 0) {
  //         tip = balance; // Empty account
  //         new_balance = 0; // Set to zero
  //       }

  //       self.trigger('new:balance', new_balance);
  //     }
  //   };
  // }

  // ,


  User: function () {
    var self = $.observable(this);

    self.tips = {};

    self.load = function () {
      $.ajax({
        type: 'GET',
        url: 'https://localhost:3700/api/user',
        success: function(data){
          if (!data) return self.trigger('error');
          self.data = data;
          return self.trigger('loaded', data);
        },
        error: function(xhr, type){
          console.log('error', xhr, type);
          return self.trigger('error');
        }
      });
    };

    self.createTip = function (post_data) {
      console.log('Tips.send', post_data);

      $.ajax({
        type: 'POST',
        url: 'https://localhost:3700/api/tip',
        data: post_data,
        success: function(data){
          if (!data) return self.trigger('error');
          self.tips.push(data);
        },
        error: function(xhr, type){
          return self.trigger('error');
        }
      });
    };
  }
};



// App
var app = new models.App();
var user = new models.User();


var link_finders = {
  facebook: function () {
    var attr_a = $('a').filter(function () {
      var attr = $(this).attr('data-hovercard');
      if (attr) {
        return attr.match(/hovercard\/user.php/);
      }
      return false;
    });

    var attr_b = $('.UFICommentActorName');

    return attr_a.add(attr_b);
  }
};

var username_finders = {
  facebook: function (that) {
    var regex = /.*\/(.*)$/;
    var link = $(that).attr('href');
    var username = link.match(regex)[1];

    return username;
  }
};



var presenters = {

  main: function () {
    var contents;

    // UI HANDLERS
    function uiHandlers () {
      $('body').on('click', function () {
        app.trigger('exit:tipping');
      });

      $('[dgw-dogewand]').on('click', function (e) {
        e.stopPropagation();
      });
    }

    app.on('init:main', function () {
      contents = $(main_html).appendTo('body'); // <- Should possibly be rewritten?
      $('[dgw-toolbar]', contents).html(presenters.toolbar()); // Render toolbar into spot
      uiHandlers(); // Attach ui handlers
    });

    app.on('exit:app', function () {
      contents.remove();
    });

    app.on('enter:tipping', function () {
      $('body').addClass('dgw-wand');
      var links = link_finders.facebook();
      links.addAttr('dgw-link');
      links.addClass('dgw-link');

      links.on('click.dgw-link', function (e) {
        e.preventDefault();
        app.trigger('create:tip', username_finders.facebook(this));
      });
    });

    app.on('exit:tipping', function () {
      $('body').removeClass('dgw-wand');
      $('.dgw-link').removeClass('dgw-link'); // Just to make sure

      var links = $('[dgw-link]');
      links.off('.dgw-link');
      links.removeAttr('dgw-link');
    });
  }

  ,

  toolbar: function () {
    var contents = $($.render(toolbar_html, user.data));

    $(contents).on('click', '[dgw-tip]', function () {
      app.trigger('enter:tipping');
    });

    $(contents).on('click', '[dgw-close]', function () {
      app.trigger('exit:app');
    });


    user.on('loaded', function (user) {
      console.log(user.balance, contents);
      $('[dgw-balance]').html(user.balance);
    });

    user.load();
    app.trigger('enter:tipping'); // Enter tipping mode immediately for convenience

    return contents; // Return contents for rendering
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



if ($('.dgw-dogewand').length) $('.dgw-dogewand').remove(); // remove app if exists

$('head').append('<style>' + style_css + '</style>');


presenters.main();
// presenters.toolbar();


app.trigger('init:main');
