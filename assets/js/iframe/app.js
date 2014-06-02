'use strict';

/*global Vue*/


var PROVIDER_ORIGIN = 'https://www.facebook.com'; // Will need to use postMessage here instead.
var VERSION = 3;

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

function messageListener () {
  parent.postMessage(JSON.stringify({ // initiate comms
    method: 'hello'
  }), PROVIDER_ORIGIN);

  window.addEventListener('message', function (event) { // signals from parent
    console.log('iframe receives', event);
    if (event.origin === PROVIDER_ORIGIN) { // Check if it's legit
      var message = JSON.parse(event.data);

      switch (message.method) {
        case 'version':
          if (message.data !== VERSION) {
            app.currentModal = 'update-modal';
          }
          break;
        case 'create_tip':
          app.currentModal = 'create-tip-modal';
          Vue.nextTick(function () {
            app.$['modal'].display_name = message.data.display_name;
            app.$['modal'].uuid = message.data.uuid;
            app.$['modal'].provider = message.data.provider;
            app.$['modal'].amount = '';
          });
          break;
      }
    }
  });
}

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
  template: '#bs-modal',
  replace: true,
  created: function () {
    this.$dispatch('show', true);
  },
  afterDestroy: function () {
    this.$dispatch('show', false);
  }
});

Vue.component('update-modal', {
  template: '#update-modal'
});

Vue.component('create-tip-modal', {
  template: '#create-tip-modal',
  data: {
    display_name: '',
    uuid: '',
    amount: '',
    provider: ''
  },
  methods: {
    submit: function () {
      var self = this;
      http('POST', '/api/v1/tips/create', {
        username: self.uuid,
        provider: self.provider,
        amount: self.amount
      }, function (err, response) {
        if (err) return console.log('shatner');
        return console.log(response);
      });
    }
  }
});

var app = new Vue({
  el: '#app',
  data: {
    currentModal: false
  },
  ready: function () {
    messageListener();
    this.resize();

    this.$on('show', function (bool) {
      this.resize(bool);
    });
  },
  methods: {
    tipping: function () {
      parent.postMessage(JSON.stringify({
        method: 'tipping',
        data: true
      }), PROVIDER_ORIGIN);
    },
    resize: function (full) {
      var toolbar = this.$el.querySelector('.toolbar');
      Vue.nextTick(function () {
        parent.postMessage(JSON.stringify({
          method: 'size',
          data: {
            width: full ? '100%' : toolbar.offsetWidth + 'px',
            height: full ? '100%' : toolbar.offsetHeight + 'px'
          }
        }), PROVIDER_ORIGIN);
      });
    }
  }
});