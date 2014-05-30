'use strict';

/*global Vue*/

var PROVIDER_ORIGIN = 'https://www.facebook.com'; // Will need to use postMessage here instead.
var VERSION = 4;

function http (method, url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      if (this.status == 200) {
        callback(null, this.response);
      }
      else {
        callback(this.status, this.response);
      }
    }
  };

  request.open(method, url, true);
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify(data));
}

// function Backend () {
//   var self = this;

//   self.
// }



Vue.directive('only', {
  isFn: true,

  bind: function () {
    this.context = this.binding.isExp ? this.vm : this.binding.compiler.vm;
  },

  update: function (handler) {
    if (typeof handler !== 'function') {
      return;
    }

    this.unbind();
    var vm = this.vm;
    var context = this.context;

    this.handler = function (e) {
      if (e.target == e.currentTarget) {
        e.targetVM = vm;
        context.$event = e;
        var res = handler.call(context, e);
        context.$event = null;
        return res;
      }
    };

    this.el.addEventListener(this.arg, this.handler);
  },

  unbind: function () {
    this.el.removeEventListener(this.arg, this.handler);
  }
});

Vue.component('bs-dropdown', {
  data: {
    show: false
  },
  ready: function () {
    var self = this;
    self.$watch('show', function (bool) {
      self.$dispatch('show', bool);
    });
  }
});


Vue.component('bs-modal', {
  data: {
    show: false
  },
  template: '#bs-modal',
  replace: true,
  ready: function () {
    var self = this;
    self.$watch('show', function (bool) {
      self.$dispatch('show', bool);
    });
  }
});


new Vue({
  el: '#app',
  data: {
    maximized: false,
    tipping: false
  },
  ready: function () {
    var self = this;
    var toolbar = self.$el.querySelector('.toolbar');
    var resize = function (full) {
      Vue.nextTick(function () {
        parent.postMessage(JSON.stringify({
          method: 'size',
          data: {
            width: full ? '100%' : toolbar.offsetWidth + 'px',
            height: full ? '100%' : toolbar.offsetHeight + 'px'
          }
        }), PROVIDER_ORIGIN);
      });
    };

    var hello = function () {
      parent.postMessage(JSON.stringify({
        method: 'hello'
      }), PROVIDER_ORIGIN);
    };

    window.addEventListener('message', function (event) { // signals from parent
      console.log('iframe receives', event)
      if (event.origin === PROVIDER_ORIGIN) { // Check if it's legit
        var message = JSON.parse(event.data);

        switch (message.method) {
          case 'version':
            if (message.data !== VERSION) {
              self.$.update_modal.show = true;
            }
            break;
          case 'create_tip':
            self.$.create_tip_modal.show = true;
            self.$.create_tip_modal.username = message.data.username;
            self.$.create_tip_modal.provider = message.data.provider;
            break;
        }
      }
    });

    hello();
    resize();
    self.$on('show', function (bool) {
      self.maximized = bool;
      resize(bool);
    });

    self.$watch('tipping', function (bool) {
      parent.postMessage(JSON.stringify({
        method: 'tipping',
        data: bool
      }), PROVIDER_ORIGIN);
    });
  }
});