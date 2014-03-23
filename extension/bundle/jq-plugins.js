'use strict';

/*global $*/

$.fn.addAttr = function(attr) {
  this.attr(attr, attr);
  return this;
};
