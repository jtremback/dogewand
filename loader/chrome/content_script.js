/* Riot 0.9.8, @license MIT, (c) 2014 Moot Inc + contributors */
// (function($) { "use strict"; // Doesn't work with zepto, whatever

$.observable = function(el) {
  var callbacks = {}, slice = [].slice;

  el.on = function(events, fn) {
    if (typeof fn === "function") {
      events.replace(/[^\s]+/g, function(name, pos) {
        (callbacks[name] = callbacks[name] || []).push(fn);
        fn.typed = pos > 0;
      });
    }
    return el;
  };

  el.off = function(events) {
    events.replace(/[^\s]+/g, function(name) {
      callbacks[name] = [];
    });
    if (events == "*") callbacks = {};
    return el;
  };

  // only single event supported
  el.one = function(name, fn) {
    if (fn) fn.one = true;
    return el.on(name, fn);
  };

  el.trigger = function(name) {
    var args = slice.call(arguments, 1),
      fns = callbacks[name] || [];

    for (var i = 0, fn; (fn = fns[i]); ++i) {
      if (!((fn.one && fn.done) || fn.busy)) {
        fn.busy = true;
        fn.apply(el, fn.typed ? [name].concat(args) : args);
        fn.done = true;
        fn.busy = false;
      }
    }

    return el;
  };

  return el;

};

// Precompiled templates (JavaScript functions)
var FN = {};

var ESCAPING_MAP = {
  "\\": "\\\\",
  "\n": "\\n",
  "\r": "\\r",
  "\u2028": "\\u2028",
  "\u2029": "\\u2029",
  "'": "\\'"
};

var ENTITIES_MAP = {
  '&': '&amp;',
  '"': '&quot;',
  '<': '&lt;',
  '>': '&gt;'
};

// Render a template with data
$.render = function(template, data) {
  if(!template) return '';

  FN[template] = FN[template] || new Function("_", "E",
    "return '" + template
      .replace(
        /[\\\n\r\u2028\u2029']/g,
        function(escape) { return ESCAPING_MAP[escape]; }
      ).replace(
        /\{\s*([\.\w]+)\s*\}/g,
        "'+(function(){try{return(_.$1?(_.$1+'').replace(/[&\"<>]/g,function(e){return E[e];}):(_.$1===0?0:''))}catch(e){return ''}})()+'"
      )+"'"
  );

  return FN[template](data, ENTITIES_MAP);
};


/* Cross browser popstate */

// for browsers only
if (typeof top != "object") return;

var currentHash,
  pops = $.observable({}),
  listen = window.addEventListener,
  doc = document;

function pop(hash) {
  hash = hash.type ? location.hash : hash;
  if (hash != currentHash) pops.trigger("pop", hash);
  currentHash = hash;
}

if (listen) {
  listen("popstate", pop, false);
  doc.addEventListener("DOMContentLoaded", pop, false);

} else {
  doc.attachEvent("onreadystatechange", function() {
    if (doc.readyState === "complete") pop("");
  });
}

// Change the browser URL or listen to changes on the URL
$.route = function(to) {
  // listen
  if (typeof to === "function") return pops.on("pop", to);

  // fire
  if (history.pushState) history.pushState(0, 0, to);
  pop(to);

};
// })(typeof top == "object" ? window.$ || (window.$ = {}) : exports);
/*global $*/

$.fn.addAttr = function(attr) {
  this.attr(attr, attr);
  return this;
};

'use strict';

var scrape_utils = {

  link_finders: {
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
  }

  ,

  username_finders: {
    facebook: function (that) {
      var regex = /.*\/(.*)$/;
      var link = $(that).attr('href');
      var username = link.match(regex)[1];

      return username;
    }
  }

};


// var scrape_utils_nojq = {

//   link_finders: {
//     facebook: function () {
//       var attr_a = $$('a').filter(function (el) {
//         var attr = el.getAttribute('data-hovercard');
//         if (attr) {
//           return attr.match(/hovercard\/user.php/);
//         }
//         return false;
//       });

//       var attr_b = $('.UFICommentActorName');

//       return attr_a.push(attr_b);
//     }
//   }

//   ,

//   username_finders: {
//     facebook: function (that) {
//       var regex = /.*\/(.*)$/;
//       var link = that.getAttribute('href');
//       var username = link.match(regex)[1];

//       return username;
//     }
//   }
// };

'use strict';

/*global $*/

function App () {
  var self = $.observable(this);

  self.checkVersion = function (version) {
    if (version !== VERSION) {
      iframe.trigger('navigate', UPDATE_URL);
    }
  };

  self.createTip = function (username) {
    iframe.trigger('navigate', URL + '/app/tips/create?username=' + username + '&provider=' + PROVIDER);
  };
}


function Iframe () {
  var self = $.observable(this);

  window.addEventListener('message', function (event) { // signals from iframe
    if (event.origin === URL) { // Check if it's legit
      var message = JSON.parse(event.data);

      switch (message.method) {
        case 'version':
          app.checkVersion(message.data);
          break;
        case 'size':
          self.trigger('size', message.data);
          break;
        case 'tip':
          self.trigger('enter:tipping', message.data);
          break;
      }
    }
  }, false);
}

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

  var URL = 'https://localhost:3700';
  var VERSION = 1; // If this is not consistent with the server's version, the user will get an update modal!
  var PROVIDER = providerFinder(window.location.host);

  if ($('.dgw-frame').length) $('.dgw-frame').remove(); // remove app if exists

  $('head').append('<style dgw-styles="dgw-styles">' + style_css + '</style>'); // add style to header


  var app = new App();
  var iframe = new Iframe();

  _app($('body')); // Presenters are denoted with _

  iframe.trigger('navigate', URL + '/iframe');
})();