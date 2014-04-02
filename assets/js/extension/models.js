'use strict';

/*global $*/

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

var models = {

  App: function () {
    var self = $.observable(this);
    self.mode = {};

    self.provider = providerFinder(window.location.host);
    console.log(self.provider);

    self.url = '<%= url %>';

    self.on('enter:tipping', function () {
      self.mode.tipping = true;
    });

    self.on('exit:tipping', function () {
      self.mode.tipping = false;
    });
  }

  ,

  User: function () {
    var self = $.observable(this);

    self.tips = {};

    self.load = function () {
      $.ajax({
        type: 'GET',
        url: 'https://localhost:3700/api/user',
        success: function(data){
          if (!data) return self.trigger('error');
          self.data = data;
          return self.trigger('loaded', data);
        },
        error: function(xhr, type){
          console.log('error', xhr, type);
          return self.trigger('error');
        }
      });
    };
  }
};
