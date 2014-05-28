'use strict';

/*global $*/

function App () {
  var self = riot.observable(this);

  self.checkVersion = function (version) {
    if (version !== VERSION) {
      iframe.trigger('navigate', UPDATE_URL);
    }
  };

  self.createTip = function (username) {
    iframe.trigger('navigate', URL + '/app/tips/create?username=' + username + '&provider=' + PROVIDER);
  };
}


function Iframe () {
  var self = riot.observable(this);

  window.addEventListener('message', function (event) { // signals from iframe
    if (event.origin === URL) { // Check if it's legit
      var message = JSON.parse(event.data);

      switch (message.method) {
        case 'version':
          app.checkVersion(message.data);
          break;
        case 'size':
          self.trigger('size', message.data);
          break;
        case 'tip':
          self.trigger('enter:tipping', message.data);
          break;
      }
    }
  }, false);
}
