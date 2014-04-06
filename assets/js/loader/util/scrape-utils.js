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
