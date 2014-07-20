'use strict';

exports.NamedError = function (message, name) {
  var error = new Error(message);
  error.name = name;
  return error;
};

exports.SuccessResponse  = function (data) {
  return {
    status: 200,
    error: false,
    data: data
  };
};