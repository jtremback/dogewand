(function () {
  'use strict';

  /*global $, main_html, style_css, toolbar_html, presenters, models*/

  function $ (selector, el) {
    if (!el) { el = document; }
    return el.querySelector(selector);
  }

  function $_ (selector, el) {
    if (!el) { el = document; }
    return Array.prototype.slice.call(el.querySelectorAll(selector));
  }

  function append ( el_string, parent ) {
    var div = document.createElement( 'div' );
    div.innerHTML = el_string;
    var el = div.firstChild;
    return parent.appendChild(el);
  }

  var style_css = 'iframe#dgw-frame{position:fixed;bottom:0;left:0;border:none;z-index:100000}.dgw-wand *{cursor:url(/public/images/wand.png),auto}.dgw-link{cursor:url(/public/images/wand_active.png),auto!important;display:inline-block;position:relative;padding:15px 10px 10px;margin:-15px -10px -10px}';

  // This stuff originates from the main config file
var config = {
  provider_list: {
    'https://www.facebook.com': 'Facebook',
    'http://www.reddit.com': 'Reddit'
  },
  version: '1',
  url: 'https://localhost:3700'
};

  /* Riot 1.0.1, @license MIT, (c) 2014 Muut Inc + contributors */
(function(e){"use strict";e.observable=function(e){var t={},n=[].slice;e.on=function(n,r){if(typeof r==="function"){n.replace(/[^\s]+/g,function(e,n){(t[e]=t[e]||[]).push(r);r.typed=n>0})}return e};e.off=function(n,r){if(n=="*")t={};else if(r){var o=t[n];for(var i=0,u;u=o&&o[i];++i){if(u===r)o.splice(i,1)}}else{n.replace(/[^\s]+/g,function(e){t[e]=[]})}return e};e.one=function(t,n){if(n)n.one=true;return e.on(t,n)};e.trigger=function(r){var o=n.call(arguments,1),i=t[r]||[];for(var u=0,f;f=i[u];++u){if(!f.busy){f.busy=true;f.apply(e,f.typed?[r].concat(o):o);if(f.one){i.splice(u,1);u--}f.busy=false}}return e};return e};var t={},n={"\\":"\\\\","\n":"\\n","\r":"\\r","'":"\\'"},r={"&":"&amp;",'"':"&quot;","<":"&lt;",">":"&gt;"};function o(e,t){return e==undefined?"":(e+"").replace(/[&\"<>]/g,function(e){return r[e]})}e.render=function(e,r,i){if(i===true)i=o;e=e||"";return(t[e]=t[e]||new Function("_","e","return '"+e.replace(/[\\\n\r']/g,function(e){return n[e]}).replace(/{\s*([\w\.]+)\s*}/g,"' + (e?e(_.$1,'$1'):_.$1||(_.$1==undefined?'':_.$1)) + '")+"'"))(r,i)};if(typeof top!="object")return;var i,u=e.observable({}),f=window.addEventListener,a=document;function c(e){e=e.type?location.hash:e;if(e!=i)u.trigger("pop",e);i=e}if(f){f("popstate",c,false);a.addEventListener("DOMContentLoaded",c,false)}else{a.attachEvent("onreadystatechange",function(){if(a.readyState==="complete")c("")})}e.route=function(e){if(typeof e==="function")return u.on("pop",e);if(history.pushState)history.pushState(0,0,e);c(e)}})(typeof top=="object"?window.riot={}:exports);

  /*
 * classList.js: Cross-browser full element.classList implementation.
 * 2014-01-31
 *
 * By Eli Grey, http://eligrey.com
 * Public Domain.
 * NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js*/

if ("document" in self && !("classList" in document.createElement("_"))) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
    classListProp = "classList"
  , protoProp = "prototype"
  , elemCtrProto = view.Element[protoProp]
  , objCtr = Object
  , strTrim = String[protoProp].trim || function () {
    return this.replace(/^\s+|\s+$/g, "");
  }
  , arrIndexOf = Array[protoProp].indexOf || function (item) {
    var
        i = 0
      , len = this.length
    ;
    for (; i < len; i++) {
      if (i in this && this[i] === item) {
        return i;
      }
    }
    return -1;
  }
  // Vendors: please allow content code to instantiate DOMExceptions
  , DOMEx = function (type, message) {
    this.name = type;
    this.code = DOMException[type];
    this.message = message;
  }
  , checkTokenAndGetIndex = function (classList, token) {
    if (token === "") {
      throw new DOMEx(
          "SYNTAX_ERR"
        , "An invalid or illegal string was specified"
      );
    }
    if (/\s/.test(token)) {
      throw new DOMEx(
          "INVALID_CHARACTER_ERR"
        , "String contains an invalid character"
      );
    }
    return arrIndexOf.call(classList, token);
  }
  , ClassList = function (elem) {
    var
        trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
      , classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
      , i = 0
      , len = classes.length
    ;
    for (; i < len; i++) {
      this.push(classes[i]);
    }
    this._updateClassName = function () {
      elem.setAttribute("class", this.toString());
    };
  }
  , classListProto = ClassList[protoProp] = []
  , classListGetter = function () {
    return new ClassList(this);
  }
;
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
  return this[i] || null;
};
classListProto.contains = function (token) {
  token += "";
  return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
  var
      tokens = arguments
    , i = 0
    , l = tokens.length
    , token
    , updated = false
  ;
  do {
    token = tokens[i] + "";
    if (checkTokenAndGetIndex(this, token) === -1) {
      this.push(token);
      updated = true;
    }
  }
  while (++i < l);

  if (updated) {
    this._updateClassName();
  }
};
classListProto.remove = function () {
  var
      tokens = arguments
    , i = 0
    , l = tokens.length
    , token
    , updated = false
  ;
  do {
    token = tokens[i] + "";
    var index = checkTokenAndGetIndex(this, token);
    if (index !== -1) {
      this.splice(index, 1);
      updated = true;
    }
  }
  while (++i < l);

  if (updated) {
    this._updateClassName();
  }
};
classListProto.toggle = function (token, force) {
  token += "";

  var
      result = this.contains(token)
    , method = result ?
      force !== true && "remove"
    :
      force !== false && "add"
  ;

  if (method) {
    this[method](token);
  }

  return !result;
};
classListProto.toString = function () {
  return this.join(" ");
};

if (objCtr.defineProperty) {
  var classListPropDesc = {
      get: classListGetter
    , enumerable: true
    , configurable: true
  };
  try {
    objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
  } catch (ex) { // IE 8 doesn't support enumerable:true
    if (ex.number === -0x7FF5EC54) {
      classListPropDesc.enumerable = false;
      objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
    }
  }
} else if (objCtr[protoProp].__defineGetter__) {
  elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(self));

}

  'use strict';

/*global $_ */

var scrape_utils = {

  link_finders: {
    Facebook: function () {
      var attrs_a = $_('a').filter(function (el) {
        var attr = el.getAttribute('data-hovercard');
        if (attr && attr.match(/hovercard\/user.php/)) {
          if (!el.children.length) {
            return true;
          }
          return false;
        }
        return false;
      });

      var attrs_b = $_('.UFICommentActorName');

      return attrs_a.concat(attrs_b);
    },

    Reddit: function () {
      return $_('a').filter(function (el) {
        var href = el.getAttribute('href');
        if (href && href.match(/reddit\.com\/user\//)) {
          if (!el.children.length) {
            return true;
          }
          return false;
        }
        return false;
      });
    }
  },

  // ^([^\/]*)

  uniqid_finders: {
    Facebook: function (that) {
      var uniqid = that.getAttribute('data-hovercard').match(/id=(\d*).*$/)[1];
      var display_name = that.textContent;
      return {
        uniqid: uniqid,
        display_name: display_name
      };
    },

    Reddit: function (that) {
      var uniqid = that.getAttribute('href').match(/.*\/(.*)/)[1];
      var display_name = that.textContent;
      return {
        uniqid: uniqid,
        display_name: display_name
      };
    }
  },

  account_finders: {
    Facebook: function () {
      return selectAttrRegex('a.fbxWelcomeBoxName', 'href', '.*?id=(.*?)(?:\&|$)') ||
             selectAttrRegex('a.fbxWelcomeBoxName', 'href', '^(?:.*)\/([^&?/]*)') ||
             selectAttrRegex('a.navLink[title="Timeline"]', 'href', '.*?id=(.*?)(?:\&|$)') ||
             selectAttrRegex('a.navLink[title="Timeline"]', 'href', '^(?:.*)\/([^&?/]*)');
    },

    Reddit: function () {
      return selectAttrRegex('span.user [href*="reddit.com/user"]', 'href', 'user\/(.*?)(\W|\/|$)');
    }
  }
};

function selectAttrRegex (select, attr, regex) {
  var selected = document.querySelector(select)  || document.body;
  var attributed = selected.getAttribute(attr) || '';
  var regexed = attributed.match(new RegExp(regex)) || [null, null];

  return regexed[1];
}


  'use strict';

/*global $, iframe, app, riot, VERSION, PROVIDER*/

function App () {
  var self = riot.observable(this);
  self.provider = null;

  self.createTip = function (user_info) {
    iframe.source.postMessage(JSON.stringify({
      method: 'create_tip',
      data: {
        uniqid: user_info.uniqid,
        display_name: user_info.display_name
      }
    }), config.url);
  };
}


function Iframe () {
  var self = riot.observable(this);

  self.listen = function (event) {
    console.log('loader receives', event)
    if (event.origin === config.url) { // Check if it's even legit
      var message = JSON.parse(event.data);

      switch (message.method) {
        case 'call':
          self.source = event.source;
          iframe.source.postMessage(JSON.stringify({
            method: 'response',
            data: {
              version: config.version,
              uniqid: scrape_utils.account_finders[app.provider]()
            }
          }), config.url);
          break;
        case 'size':
          self.trigger('size', message.data);
          break;
        case 'tipping':
          app.trigger('tipping', message.data);
          break;
        case 'destroy':
          app.trigger('destroy');
          break;
      }
    }
  }
}

  'use strict';

/*global $, templates, scrape_utils, app, iframe, append*/

function _app (container) {
  _iframe(container);
  var links;

  window.addEventListener('message', iframe.listen, false);

  app.on('tipping', function (bool) {
    if (bool) enterTipping();
    else exitTipping();
  });

  function enterTipping() {
    container.classList.add('dgw-wand');

    links = scrape_utils.link_finders[app.provider]();

    links.forEach(function (el) {
      el.classList.add('dgw-link');
      el.addEventListener('click', createTip);
    });

    container.addEventListener('click', exitTipping);
  }

  function createTip (e) {
    e.preventDefault();
    app.createTip(scrape_utils.uniqid_finders[app.provider](this));
  }

  function exitTipping() {
    container.classList.remove('dgw-wand');
    container.removeEventListener('click', exitTipping);

    links.forEach(function (el) {
      el.classList.remove('dgw-link');
      el.removeEventListener('click', createTip);
    });
  }

  app.on('destroy', function () {
    var dgw_frame = $('#dgw-frame');
    if (dgw_frame) dgw_frame.remove();

    var dgw_styles = $('#dgw-styles');
    if (dgw_styles) dgw_styles.remove();

    window.removeEventListener('message', iframe.listen);
  });

}



function _iframe (container) {
  var contents = append('<iframe id="dgw-frame" width="100%"></iframe>', container);
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



  var URL = 'https://localhost:3700';
  var VERSION = '1'; // If this is not consistent with the server's version, the user will get an update modal!

  var dgw_frame = $('#dgw-frame');
  if (dgw_frame) {
    dgw_frame.remove(); // remove app if exists
  }

  append('<style id="dgw-styles">' + style_css + '</style>', $('body')); // add style to head

  var app = new App();
  var iframe = new Iframe();

  app.provider = config.provider_list[window.location.origin];

  _app($('body')); // Presenters are denoted with _

  iframe.trigger('navigate', URL + '/iframe');
})();