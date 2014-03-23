'use strict';

/*global $, main_html, style_css, toolbar_html*/
console.log('hello.')

// = include style.css
// = include main.html
// = include toolbar.html

// = include zepto.1.1.3.js
// = include riot.0.9.8.js


// Models
var models = {

  App: function() {
    var self = $.observable(this);
    self.mode = {};

    self.on('enter:tip', function () {
      self.mode.tip = true;
    });

    self.on('exit:tip', function () {
      self.mode.tip = false;
    });
  }

  ,

  User: function () {
    var self = $.observable(this);

    self.data = 'false';

    self.load = function () {

      $.ajax({
        type: 'GET',
        url: 'https://localhost:3700/api/user',
        success: function(data){
          if (!data) return self.trigger('error');
          self.data = data;
          return self.trigger('loaded');
        },
        error: function(xhr, type){
          alert('Y U NO WORK?')
        }
      });
    };
  }

};



if ($('.dgw-dogewand').length) $('.dgw-dogewand').remove(); // remove app if exists

$('head').append('<style>' + style_css + '</style>');


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

  main: function (template) {
    var contents;

    // UI HANDLERS
    function uiHandlers () {
      $('body').on('click', function () {
        app.trigger('exit:tip');
      });

      $('.dgw-dogewand').on('click', function (e) {
        e.stopPropagation();
      });

      $('.dgw-link').on('click', function (e) {
        e.stopPropagation();
      });
    }

    app.on('init:main', function () {
      contents = $(template).appendTo('body');
      app.trigger('init:toolbar');
      uiHandlers(); // Attach ui handlers
    });

    app.on('exit:app', function () {
      contents.remove();
    });

    app.on('enter:tip', function () {
      $('body').addClass('dgw-wand');
      link_finders.facebook().addClass('dgw-link');
    });

    app.on('exit:tip', function () {
      $('body').removeClass('dgw-wand');
    });
  }

  ,

  toolbar: function (el, template) {
    var contents;
    var $el; // We need to wait until init to set this

    // UI HANDLERS
    function uiHandlers () {
      $('.dgw-tip').on('click', function () {
        app.trigger('enter:tip');
      });
    }

    app.on('init:toolbar', function () {
      $el = $(el);
      user.load();
      user.on('loaded', function () {
        contents = $el.html($.render(template, user.data)); // Render toolbar
        uiHandlers(); // Attach ui handlers
        app.trigger('enter:tip');
      });
    });
  }

};


presenters.main(main_html);
presenters.toolbar('.dgw-toolbar', toolbar_html);


app.trigger('init:main');
