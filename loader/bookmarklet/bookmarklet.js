(function () {
  'use strict';

  /*global $, main_html, style_css, toolbar_html, presenters, models*/

  function $ (selector, el) {
    if (!el) {el = document;}
    return el.querySelector(selector);
  }

  function $_ (selector, el) {
    if (!el) {el = document;}
    return Array.prototype.slice.call(el.querySelectorAll(selector));
  }

  function append ( el_string, parent ) {
    var div = document.createElement( 'div' );
    div.innerHTML = el_string;
    var el = div.firstChild;
    return parent.appendChild(el);
  }

  var style_css = 'iframe#dgw-frame{position:fixed;bottom:0;left:0;border:0;z-index:100000}.dgw-wand *{cursor:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAgCAYAAAAIXrg4AAAEiElEQVRIDZ1WW0hjVxQdNTOdZLS1dbSxTT9MX9HpJLZgNaU0fhW/in4MxY9C/ZGi1UIc0PoV/IlUpBVBFAQRRcFSH4gI1SLICGIRROoLqxYRtaBofJvcm9O1DrkhYuTe6YHFee3HXXvvc869dy9+S8AykQgkAaaBgYEHiqJ8I4RIxfx/N82oCRYeAOaamprHJycnzy8vL3dhXIRCoedYp+OXarGGX4Hmo9bW1qzDw8Ofrq+vA1dXVwrm4f7+/jAcbWOfH0AdQ00zfh/SluHh4adHR0edCMfV8fFxyOfzibS0NIE9kZ2dTRIC+19hztAZanRwf3Jy0o5Q/BoOh5Xd3d1gdXW1sFgs0nBiYqLIzMyU46mpqRBY/E4dwBALxvNhRUXFOwhFYHR0VCQlJUljZrNZVFZWis3NTTE9PS3XSkpKSEJdW1tzQM9QLkjVAmSsrKz48XVKRkaGNLa4uEhj0eZ2uwXZ7O3tBS8uLn6BjqFc0MEjwOp0Oj85Pz8/amlpCWMuamtro8Y5GBkZkY7r6+sFkn/S29v7KuR0w6QxeBPCORMTEz9DWbXZbCIlJUUg0VEnyI/IyckRZIhyVbH3HXR0ky1zAME04L309PQvoHjY0dEhWTQ2NkYdcNDW1iZZ9PT0qAjnX9DRTbasIgiSrg34eGhoqBllqmZlZQmr1SqQfJloFIJg4iEjCgoKpGPkw4O5brJJ0ww8Bj5ITk72oNb/7e7uVjEXeXl5Mrkcx2JhYYHJHsCabrI1FikQJovcvr4+v6qqYYfDccNorIOysjIBmdDs7Cx1DLF4CEGyeN9kMn1+cHCwg0tOsog1rI0ZrkAgEDo9PfVhTTfZsSzehoKrq6vLh0CHXS7XnSyampoEkr1fWFjIj9Mt2RsVBYXP9vf3t3C6FYzjOrHb7QLlG8bF+DVkXpqFs729/UeWS35+flwHdDw2NqYg2S8w1i1ZyMhkka48F+jduPzWcBneyaKoqEiWLO4sV0Qf3d2NcWTZJQNvAc7m5mYvLXg8nrgsEhISxNbWVhC56IjoGsoFH543gHcB9/b29uLMzMydLLxeL6+Pi8HBQTLXLdlYFplQeNrQ0PA9WTAcmN9CamoqT7xydnb2A/Z1kw0Z+RUaCzvmBYjxn/Pz8yGMbzngWmdnJ5/UvzE2lGyNBa9ysviorq6uHCTCxcXFcR3k5uaSpEDJfgl53TBBJsridYzJIn99fX1meXk5xIcH81uYm5sLIlQj2DMUplgWVig9qaqq+pYHq7S09IZxPFYCDxCuJlXFe/IPrhhenrrVBJkbLLIwz1tdXf1jY2NDsmDpjo+PKwwN3pHNpaWlKoSKP2e6NyyNs8Wy4KvnKC8vf4YPVVD7Kg3jIC7hAfJi70OAMsybYQeQlSz4p/caYAOegMFvOzs7L/x+P5/NT4HsyB6/njeBzIGhGEGYcqwKOqEy/0IYY5YjcxEELiO4Rs9Sltc8aRhpNMI3mopsHNMQnXKPxrhH8LTL9xy9sSxTMNJokCB99mSmOadRDVyTzWiINHn21NGgrdOgBm1N9v8B04Wtb4LBoPcAAAAASUVORK5CYII=),auto}.dgw-link{cursor:url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAAcCAYAAACQ0cTtAAAFJUlEQVRIDZ1WW0xjRRg+bSmwFSyCrrALyk3MGlzcRUFuMdk1XCIYE2yIDzzAJsIj+yAksFESyaqAgfgg8iAgD5CQgEJWwgKGW3QtlzfKQjbBclsQCOFO23NOx++fcJqWUkD+5MtM//lnvplv/vlPBcHVVM3Nzb6iKPYymMVi+RzDXoAaUCmhlkXhY6V/Vvto7YHHOHVHR8eVo6Ojvv39fbGpqYnZ7XZ5Y2PjMyzoA3htzAr+1gWNwbosmC1LQqbJJHgrZO8+kRwL/zxb6P9o9UvD7/9WmrufP8isNBl4HO2YTN3Y2Oibk5PzqyzLd2FehYWFQkNDgyowMPCX2dnZDMRop58KGh4tCOy45U1kx5Zeo9Z87+yjvkpgLnHkIyIdTvSYTpSQkEABHCqVirW3t0uQ9Wh8fPwu/FcAr5MyvvdEyksaZ+zWmC0O4w5zk/FYOheilJQUNjg4yPR6PdNqtay3t1eyWq07AwMD72MlItS82b3hn/gn+zTxb7k10ci2iAxYSTDKP97+i2UKlSaHxAq7GtL9BunuwLywewFEQl9fnwAphf7+fkGn0wm5ubmaqakpXWpqag82F43JWtG6oFyBspZrG+jtSCjHAGVdRkYGly00NJTt7e2Ry2HYAD9hQEAAm56eFg8PDxcgexQW8AXoDlWeZHSQKB3c1ZrJZLKFhIRwwvLycgeR0lEIg4ODmdlstuFuZ0pLS0OxBmWphhIEUj5T1vTYtra2xh4cHJgXFxfFqKioUwnHxsaYn58fH4uIiGDr6+vi7u6uMT8//6pC6Jz6HskwoC8qKorb2tp6urm5KcbFxbkQjo6OOogQy8diY2MZyMSdnZ3+8PDwAPgpGVwePn6fai/AezU5Ofkd7HgKdyalpaXxRbFzNyLE8rGkpCSqMNL29nYHfP6AQoiuZ6OgF4GQyMjIt5eXl4eR5lJ2djZfFH6PLSWWJEkyVPkJcX7AuYSUUXTRnNDb2/vG/Px8N56DTCeD/0zk5eVRWbOvra09RCwRagGPz0Jlffj4EwQohMHox8zMzLQgG+0lJSVnkiGWFRcX88RdWlr6Ar/pWk4nZNXDBlYzbJa+/SOr5mY+BZL+rwJvIOXriLCqqupcwoqKCn5CqHIPcxVC14fNyaqH/2HVg5nPsn6g05HuJAeldfTQ0NBXJCkesl2tVp9JWldXZ0eohHdrwFwdQJ+nE4TfjSifBxogvUkGInwFiOzq6rqPRLChVMm4U4+EVLhbWlpkFG7L5ORkOubywo3WlRAOZ1MISY6XgQgscg9ZeoRiLCkPHH43Yo1Gw3p6eiSbzbY3MjKSjBhHWUPfoymEJEcQEF5fX5+HarMzMTEhBgUFuREhhvt8fHwYnpCMzT03GAykzrlPAjH8+KQ7EQYCr5eVlX2E6rE+NzcnUuGGzw01NTX0GmSj0Xgf46QM/yyhPddIbyKkCUT4WkFBwR085MWVlRUxJibGhUwh6uzs/BqxbwGU2bRZes8XMmfClzAjND09PRm1dAakYnx8PCesra3lJ8L/l3rEfADcAP43GeZwSWl3dOFUfK+D5Pbq6uo47lHC3wdnoiyMJwJRAN33hWVErMPohERI71EPXAsLC4tFMgzQHbW1tX0D34dAEkCnugZQGbxQgiDOzZwJaaFgZF80pKO/fLeAm0AMcB0gBRypTxMvYzSPngYlDhUApfLQqen+RMB6DAmtDLDLkmEuv0PllERKRLQBIqPFFRL7sY9PQP/SRmQnQYsRoUJCfW7/Ab1t8CRjuOh+AAAAAElFTkSuQmCC),auto!important;display:inline-block;position:relative;padding:10px;margin:-10px;padding-top:15px;margin-top:-15px}';

  /* Riot 1.0.1, @license MIT, (c) 2014 Muut Inc + contributors */
(function(e){"use strict";e.observable=function(e){var t={},n=[].slice;e.on=function(n,r){if(typeof r==="function"){n.replace(/[^\s]+/g,function(e,n){(t[e]=t[e]||[]).push(r);r.typed=n>0})}return e};e.off=function(n,r){if(n=="*")t={};else if(r){var o=t[n];for(var i=0,u;u=o&&o[i];++i){if(u===r)o.splice(i,1)}}else{n.replace(/[^\s]+/g,function(e){t[e]=[]})}return e};e.one=function(t,n){if(n)n.one=true;return e.on(t,n)};e.trigger=function(r){var o=n.call(arguments,1),i=t[r]||[];for(var u=0,f;f=i[u];++u){if(!f.busy){f.busy=true;f.apply(e,f.typed?[r].concat(o):o);if(f.one){i.splice(u,1);u--}f.busy=false}}return e};return e};var t={},n={"\\":"\\\\","\n":"\\n","\r":"\\r","'":"\\'"},r={"&":"&amp;",'"':"&quot;","<":"&lt;",">":"&gt;"};function o(e,t){return e==undefined?"":(e+"").replace(/[&\"<>]/g,function(e){return r[e]})}e.render=function(e,r,i){if(i===true)i=o;e=e||"";return(t[e]=t[e]||new Function("_","e","return '"+e.replace(/[\\\n\r']/g,function(e){return n[e]}).replace(/{\s*([\w\.]+)\s*}/g,"' + (e?e(_.$1,'$1'):_.$1||(_.$1==undefined?'':_.$1)) + '")+"'"))(r,i)};if(typeof top!="object")return;var i,u=e.observable({}),f=window.addEventListener,a=document;function c(e){e=e.type?location.hash:e;if(e!=i)u.trigger("pop",e);i=e}if(f){f("popstate",c,false);a.addEventListener("DOMContentLoaded",c,false)}else{a.attachEvent("onreadystatechange",function(){if(a.readyState==="complete")c("")})}e.route=function(e){if(typeof e==="function")return u.on("pop",e);if(history.pushState)history.pushState(0,0,e);c(e)}})(typeof top=="object"?window.riot={}:exports);
//# sourceMappingURL=riot.min.js.map
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

var scrape_utils = {

  link_finders: {
    facebook: function () {
      var attrs_a = $_('a').filter(function (el) { // hello $_
        // console.log(el)
        var attr = el.getAttribute('data-hovercard');
        if (attr) {
          return attr.match(/hovercard\/user.php/);
        }
        return false;
      });

      var attrs_b = $_('.UFICommentActorName');

      return attrs_a.concat(attrs_b);
    }
  }

  ,

  username_finders: {
    facebook: function (that) {
      var regex = /.*\/(.*)$/;
      var link = that.getAttribute('href');
      var username = link.match(regex)[1];

      return username;
    }
  }
};


  'use strict';

/*global $*/

function App () {
  var self = riot.observable(this);

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
  var self = riot.observable(this);

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
}



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
  // var PROVIDER = providerFinder(window.location.host);

  var dgw_frame = $('.dgw-frame');
  if (dgw_frame && dgw_frame.tagName) dgw_frame.remove(); // remove app if exists

  append('<style dgw-styles="dgw-styles">' + style_css + '</style>', $('body')); // add style to head

  var app = new App();
  var iframe = new Iframe();

  _app($('body')); // Presenters are denoted with _

  iframe.trigger('navigate', URL + '/iframe');
})();