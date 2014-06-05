'use strict';

/*global Vue*/


var PROVIDER_ORIGIN = 'https://www.facebook.com'; // Will need to use postMessage here instead.
var VERSION = 3;
var app;

function http (method, url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      console.log(this.response)
      var response = JSON.parse(this.response);
      if (this.status == 200) {
        callback(null, response);
      }
      else {
        callback(this.status, response);
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
            app.$['modal'].name = message.data.name;
            app.$['modal'].uniqid = message.data.uniqid;
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

Vue.component('login-modal', {
  template: '#login-modal'
});

Vue.component('confirm-tip-modal', {
  template: '#confirm-tip-modal'
});

Vue.component('error-modal', {
  template: '#error-modal',
  data: {
    message: ''
  }
});

Vue.component('create-tip-modal', {
  template: '#create-tip-modal',
  data: {
    name: '',
    uniqid: '',
    amount: '',
    provider: ''
  },
  methods: {
    submit: function () {
      var self = this;
      http('POST', '/api/v1/tips/create', {
        uniqid: self.uniqid,
        name: self.name,
        provider: self.provider,
        amount: self.amount
      }, function (err, response) {
        if (err) {
          if (err === 401) {
            self.currentModal = 'login-modal';
          }
          else {
            app.currentModal = 'error-modal';
            Vue.nextTick(function () {
              return app.$['modal'].message = response.data;
            });
          }
        }
        else {
          app.currentModal = 'confirm-tip-modal';
          Vue.nextTick(function () {
            return app.$['modal'].$data = response.data;
          });
        }
      });
    }
  }
});

var app = new Vue({
  el: '#app',
  data: {
    currentModal: false,
    user: {}
  },
  ready: function () {
    messageListener();
    this.resize();
    this.userInfo();

    this.$on('show', function (bool) {
      this.resize(bool);
    });
  },
  methods: {
    userInfo: function () {
      var self = this;
      http('GET', '/api/v1/user', null, function (err, response) {
        if (err) {
          if (err === 401) {
            self.currentModal = 'login-modal';
          }
          else {
            self.currentModal = 'error-modal';
            Vue.nextTick(function () {
              return self.$['modal'].message = response['data'];
            });
          }
        }
        else {
          self.user = response.data;
        }
      });
    },
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