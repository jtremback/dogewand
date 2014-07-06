'use strict';

/*global Vue, _, config*/

var app;
console.log(config)

function http (method, url, data, callback) {
  var request = new XMLHttpRequest();
  request.onreadystatechange = function () {
    if (this.readyState == 4) {
      console.log('http response', this.response)
      var response = JSON.parse(this.response);
      if (this.status == 200) {
        callback(null, response);
      }
      else {
        callback(this.status, response);
      }
    }
  };

  var csrf_cookie = decodeURIComponent(document.cookie.match(/CSRF-TOKEN=([^\b]*)/)[1]);

  request.open(method, url, true);
  request.setRequestHeader('X-CSRF-Token', csrf_cookie);
  request.setRequestHeader('Content-Type', 'application/json');
  request.send(JSON.stringify(data));
  console.log('http request', JSON.stringify(data))
}

function modalErrorHandler (err, response) {
  if (err === 401) {
    app.currentModal = 'login-modal';
  }
  else {
    app.setCurrentModal('error-modal', response.data);
  }
}


function Messenger (app) {
  this.app = app;
  window.addEventListener('message', this.listen.bind(this));
  this.post('call', null, '*');
}

Messenger.prototype.post = function (method, data, provider_origin) {
  parent.postMessage(JSON.stringify({ // initiate comms
    method: method,
    data: data
  }), provider_origin || this.app.provider_origin);
};

Messenger.prototype.listen = function (event) {
  console.log('iframe receives', event);

  if (config.provider_list[event.origin]) { // Check if it's legit
    this.app.provider_origin = event.origin;
    this.app.provider = config.provider_list[event.origin];

    var message = JSON.parse(event.data);

    switch (message.method) {
      case 'response':
        if (message.data.version !== config.version) {
          this.app.setCurrentModal('update-modal');
        }
        this.app.uniqid = message.data.uniqid;
        break;
      case 'create_tip':
        this.app.setCurrentModal('create-tip-modal', message.data);
        break;
    }
  }
};


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
    self.$watch('fullsize', function (bool) {
      self.$dispatch('fullsize', bool);
    });
  }
});

Vue.component('bs-modal', {
  template: '#bs-modal',
  replace: true,
  created: function () {
    this.$dispatch('fullsize', true);
  },
  afterDestroy: function () {
    this.$dispatch('fullsize', false);
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
    tip_id: '',
    url: 'https://localhost:3700'
  },
  methods: {
    init: function (data) {
      this.tippee = data.tip.tippee;
      this.amount = data.tip.amount;
      this.tip_id = data.tip.tip_id;
    }
  }
});

Vue.component('confirm-withdraw-modal', {
  template: '#confirm-withdraw-modal',
  data: {
    amount: '',
    address: ''
  },
  methods: {
    init: function (data) {
      this.amount = data.amount;
      this.address = data.address;
    }
  }
});

Vue.component('error-modal', {
  template: '#error-modal',
  data: {
    message: ''
  },
  methods: {
    init: function (data) {
      this.message = data;
    }
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
      http('POST', '/api/v1/user/withdraw', this.$data, function (err, response) {
        if (err) return modalErrorHandler(err, response);
        else {
          app.setCurrentModal('confirm-withdraw-modal', response.data);
        }
      });
    }
  }
});

Vue.component('create-tip-modal', {
  template: '#create-tip-modal',
  data: {
    display_name: '',
    uniqid: '',
    amount: '',
    provider: '',
  },
  methods: {
    submit: function () {
      this.$data.account_id = app.current_account.account_id;
      this.$data.provider = app.provider;
      http('POST', '/api/v1/tips/create', this.$data, function (err, response) {
        if (err) return modalErrorHandler(err, response);
        else {
          app.user.balance = response.data.new_balance;
          app.setCurrentModal('confirm-tip-modal', response.data);
        }
      });
    },
    init: function (data) {
      this.display_name = data.display_name;
      this.uniqid = data.uniqid;
      this.provider = app.provider;
      this.amount = '';
    }
  }
});

var app = new Vue({
  el: '#app',
  data: {
    currentModal: false,
    dropdown: false,
    user: {},
    provider: null,
    provider_origin: null
  },
  computed: {
    current_account: {
      // the getter should return the desired value
      $get: function () {
        return _.find(this.user.accounts, { provider: 'Facebook' });
      }
    }
  },
  ready: function () {
    var self = this;
    this.messenger = new Messenger(self);
    this.userInfo();

    self.$on('fullsize', function (bool) {
      self.resize(bool);
      if (!bool) self.dropdown = false;
    });
  },
  methods: {
    setCurrentModal: function (name, data) {
      var self = this;
      self.currentModal = name;
      Vue.nextTick(function () {
        if (self.$.modal.init) return self.$.modal.init(data);
      });
    },
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
      this.messenger.post('tipping', true);
    },
    resize: function (full) {
      var self = this;
      var toolbar = this.$el.querySelector('.toolbar');
      Vue.nextTick(function () {
        self.messenger.post('size', {
          width: full ? '100%' : toolbar.scrollWidth + 'px',
          height: full ? '100%' : toolbar.scrollHeight + 'px'
        });
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
      this.messenger.post('destroy');
    }
  }
});