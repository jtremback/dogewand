'use strict';

/*global $*/

var models = {

  App: function () {
    var self = $.observable(this);
    self.mode = {};

    self.host = window.location.host.match(/^.*\.(.*)\.(.*)$/)[1];

    self.on('enter:tipping', function () {
      self.mode.tipping = true;
    });

    self.on('exit:tipping', function () {
      self.mode.tipping = false;
    });
  }

  ,

  Tipper: function (balance) {
    var self = $.observable(this);

    var tip;

    self.calc = function (opts) {
      var new_balance;

      if (opts.balance) {
        tip = balance - opts.balance;
        if (tip < 0) {
          tip = balance; // Empty account
        }

        self.trigger('refresh:tip', tip);
      }

      if (opts.tip) {
        new_balance = balance - opts.tip; // If it goes negative
        if (new_balance < 0) {
          tip = balance; // Empty account
          new_balance = 0; // Set to zero
        }

        self.trigger('refresh:balance', new_balance);
      }
    };
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

    self.createTip = function (post_data) {
      console.log('Tips.send', post_data);

      $.ajax({
        type: 'POST',
        url: 'https://localhost:3700/api/tip',
        data: post_data,
        success: function(data){
          if (!data) return self.trigger('error');
          self.tips.push(data);
        },
        error: function(xhr, type){
          return self.trigger('error');
        }
      });
    };
  }
};
