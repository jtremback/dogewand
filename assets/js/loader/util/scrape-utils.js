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
      var tinyman = $_('a').filter(function (el) {
        var href = el.getAttribute('href');
        if (href && href.match(/\?ref\=tn\_tnmn/)) {
          if (el.children[1] && el.children[1].className === 'headerTinymanName') {
            return true;
          }
          return false;
        }
        return false;
      });

      return tinyman[0].getAttribute('href').match(/.*\/([^?]*)/)[1];
    },

    Reddit: function () {
      return $_('#header-bottom-right > .user > a')[0].innerText;
    }
  }
};

