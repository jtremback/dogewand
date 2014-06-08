'use strict';

/*global Vue*/

var PROVIDER_ORIGIN = 'https://www.facebook.com'; // Will need to use postMessage here instead.
var VERSION = '<%= version %>';
var app;

function http (method, url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      var response = JSON.parse(this.response);
      console.log(response)
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

function modalErrorHandler (err, response) {
  if (err === 401) {
    app.currentModal = 'login-modal';
  }
  else {
    app.currentModal = 'error-modal';
    Vue.nextTick(function () {
      app.$.modal.$data.message = response.data;
    });
  }
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
            app.$.modal.name = message.data.name;
            app.$.modal.uniqid = message.data.uniqid;
            app.$.modal.provider = message.data.provider;
            app.$.modal.amount = '';
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

Vue.component('deposit-modal', {
  template: '#deposit-modal',
  data: {
    address: ''
  },
  ready: function () {
    var self = this;
    http('GET', '/api/v1/user/address', null, function (err, response) {
      if (err) return modalErrorHandler(err, response);
      else {
        self.address = response.data;
      }
    });
  }
});

Vue.component('confirm-tip-modal', {
  template: '#confirm-tip-modal',
  data: {
    tippee: '',
    amount: '',
    id: '',
    url: '<%= url %>'
  }
});

Vue.component('confirm-withdraw-modal', {
  template: '#confirm-withdraw-modal',
  data: {
    amount: '',
    address: ''
  }
});

Vue.component('error-modal', {
  template: '#error-modal',
  data: {
    message: ''
  }
});

Vue.component('withdraw-modal', {
  template: '#withdraw-modal',
  data: {
    amount: '',
    address: ''
  },
  methods: {
    submit: function () {
      console.log(JSON.stringify(this.$data));
      http('POST', '/api/v1/user/withdraw', this.$data, function (err, response) {
        if (err) return modalErrorHandler(err, response);
        else {
          app.currentModal = 'confirm-withdraw-modal';
          Vue.nextTick(function () {
            app.$.modal.$data.address = response.data.address;
            app.$.modal.$data.amount = response.data.amount;
          });
        }
      });
    }
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
      http('POST', '/api/v1/tips/create', this.$data, function (err, response) {
        if (err) return modalErrorHandler(err, response);
        else {
          app.user.balance = response.data.user.balance;

          app.currentModal = 'confirm-tip-modal';
          Vue.nextTick(function () {
            app.$.modal.$data.tippee = response.data.tip.tippee;
            app.$.modal.$data.amount = response.data.tip.amount;
            app.$.modal.$data.id = response.data.tip._id;
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
    dropdown: false,
    user: {}
  },
  ready: function () {
    var self = this;
    messageListener();
    this.userInfo();

    setTimeout(function () {
      self.resize();
    }, 500);

    self.$on('show', function (bool) {
      self.resize(bool);
      if (!bool) self.dropdown = false;
    });
  },
  methods: {
    userInfo: function () {
      var self = this;
      http('GET', '/api/v1/user', null, function (err, response) {
        if (err) return modalErrorHandler(err, response);
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
            width: full ? '100%' : toolbar.scrollWidth + 'px',
            height: full ? '100%' : toolbar.scrollHeight + 'px'
          }
        }), PROVIDER_ORIGIN);
      });
    },
    getBalance: function () {
      var self = this;
      http('GET', '/api/v1/user', null, function (err, response) {
        if (err) return modalErrorHandler(err, response);
        else {
          self.user.balance = response.data.balance;
        }
      });
    },
    destroy: function () {
      parent.postMessage(JSON.stringify({
        method: 'destroy'
      }), PROVIDER_ORIGIN);
    }
  }
});