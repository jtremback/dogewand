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
