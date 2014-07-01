'use strict';

/*global $, iframe, app, riot, VERSION, PROVIDER*/

function App () {
  var self = riot.observable(this);

  self.version = function (version) {
    iframe.source.postMessage(JSON.stringify({
      method: 'version',
      data: VERSION
    }), URL);
  };

  self.createTip = function (user_info) {
    iframe.source.postMessage(JSON.stringify({
      method: 'create_tip',
      data: {
        uniqid: user_info.uniqid,
        display_name: user_info.display_name,
        provider: PROVIDER
      }
    }), URL);
  };
}


function Iframe () {
  var self = riot.observable(this);

  window.addEventListener('message', function (event) { // signals from iframe
    console.log('loader receives', event)
    if (event.origin === URL) { // Check if it's even legit
      var message = JSON.parse(event.data);

      switch (message.method) {
        case 'hello':
          self.source = event.source;
          app.version(VERSION);
          break;
        case 'size':
          self.trigger('size', message.data);
          break;
        case 'tipping':
          app.trigger('tipping', message.data);
          break;
        case 'destroy':
          app.trigger('destroy');
          break;
      }
    }
  }, false);
}
