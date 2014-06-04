'use strict';

exports.NamedError = function(message, name) {
  var error = new Error(message);
  error.name = name;
  return error;
};