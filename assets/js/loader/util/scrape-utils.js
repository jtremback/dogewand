'use strict';

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

  uuid_finders: {
    Facebook: function (that) {
      var uuid = that.getAttribute('data-hovercard').match(/id=(\d*).*$/)[1];
      var display_name = that.textContent;
      console.log('uuid', uuid)
      return {
        uuid: uuid,
        display_name: display_name
      };
    }
  }
};

