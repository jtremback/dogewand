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
