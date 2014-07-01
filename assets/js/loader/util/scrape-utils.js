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
    }
  },

  uniqid_finders: {
    Facebook: function (that) {
      var uniqid = that.getAttribute('data-hovercard').match(/id=(\d*).*$/)[1];
      var display_name = that.textContent;
      return {
        uniqid: uniqid,
        display_name: display_name
      };
    }
  }
};

