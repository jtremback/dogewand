'use strict';

/*global $*/

function App () {
  var self = riot.observable(this);

  self.version = function (version) {
    iframe.source.postMessage(JSON.stringify({
      method: 'version',
      data: VERSION
    }), URL);
  };

  self.createTip = function (username) {
    iframe.source.postMessage(JSON.stringify({
      method: 'create_tip',
      data: {
        username: username,
        provider: PROVIDER
      }
    }), URL);
  };
}


function Iframe () {
  var self = riot.observable(this);

  window.addEventListener('message', function (event) { // signals from iframe
    if (event.origin === URL) { // Check if it's even legit
      var message = JSON.parse(event.data);
      console.log('event source', event.source)

      switch (message.method) {
        case 'hello':
          self.source = event.source;
          app.version(VERSION);
          break;
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
