'use strict';

/*global Vue, _, config*/

var app;

// Vue.config('debug', true);

document.domain = document.domain;

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
    app.currentModal = 'dogewand-login-modal';
  }
  else {
    app.setCurrentModal('error-modal', response.data);
  }
}


function Messenger (app) {
  this.app = app;
}

Messenger.prototype.post = function (method, data, provider_origin) {
  debugger

  parent.postMessage(JSON.stringify({
    method: method,
    data: data
  }), provider_origin || this.app.page.origin);
};

Messenger.prototype.connect = function (callback) {
  var self = this;
  window.addEventListener('message', handshake, false);
  this.post('call', null, '*');
  function handshake (event) {
    // console.log('iframe receives', event.source.location.href);
    var message = JSON.parse(event.data);
    if (message.method === 'response' && config.provider_list[event.origin]) {
      self.app.page.provider = config.provider_list[event.origin];
      self.app.page.origin = event.origin;
      self.app.page.href = event.source.location.href;
      self.app.page.uniqid = message.data.uniqid;

      if (message.data.version !== config.version) {
        self.setCurrentModal('update-modal');
      }

      window.removeEventListener('message', handshake);
      window.addEventListener('message', self.listen.bind(self), false);
      callback(message);
    }
  }
};

Messenger.prototype.listen = function (event) {
  console.log('iframe receives', event);

  if (event.origin === this.app.page.origin) { // Check if it's legit
    this.app.page.origin = event.origin;
    this.app.page.provider = config.provider_list[event.origin];

    var message = JSON.parse(event.data);

    switch (message.method) {
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
    self.$watch('show', function (bool) {
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



Vue.component('provider-login-modal', {
  template: '#provider-login-modal',
  afterDestroy: function () {
    this.$parent.destroy();
  }
});

Vue.component('login-modal', {
  template: '#login-modal'
});

Vue.component('switch-or-merge-modal', {
  template: '#switch-or-merge-modal'
});

Vue.component('add-provider-modal', {
  template: '#add-provider-modal'
});

Vue.component('new-or-link-modal', {
  template: '#new-or-link-modal'
});

Vue.component('profile-modal', {
  template: '#profile-modal'
});


// Vue.component('username-modal', {
//   template: '#username-modal',
//   data: {
//     new_username: '',
//     unavailable: false
//   },
//   methods: {
//     setUsername: function () {
//       var self = this;
//       http('POST', '/api/v1/user/username', { username: self.new_username}, function (err, response) {
//         if (err) return modalErrorHandler(err, response);
//         else {
//           if (response.data === 'success') {
//             app.setCurrentModal(false);
//           }
//           else if (response.data === 'taken') {
//             this.unavailable = true;
//           }
//         }
//       });
//     }
//   }
// });


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
    url: '<%= url %>'
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
      this.$data.provider = app.page.provider;
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
      this.provider = app.page.provider;
      this.amount = '';
    }
  }
});

var app = new Vue({
  el: '#app',
  data: {
    currentModal: false,
    dropdown: false,
    page: {
      uniqid: null,
      provider: null,
      provider_origin: null,
      display_name: null
    }
  },
  computed: {
    current_account: {
      $get: function () {
        return _.find(this.user.accounts, { provider: this.page.provider });
      }
    }
  },

  ready: function () {
    var self = this;
    self.messenger = new Messenger(self);
    self.messenger.connect(function (message) {

      if (!self.page.uniqid) return self.setCurrentModal('provider-login-modal');

      http('GET', '/api/v1/user', null, function (err, response) {
        if (response.status === 200) self.user = response.data;


        http('GET', '/api/v1/accounts?provider=' + self.page.provider + '&uniqid=' + self.page.uniqid, null, function (err, response) {
          if (response.status === 200) {
            self.page.display_name = response.data.display_name;
            self.page.siblings = response.data.siblings;
          }

          if (JSON.stringify(self.user) !== '{}') {  // If the account is signed in
            var creds_match = self.user.accounts.some(function (account) {
              return account.provider === self.page.provider && account.uniqid.some(function (uniqid) {
                return uniqid === self.page.uniqid;
              });
            });
            if (creds_match) { // Account is signed in on dogewand and page
              // It's go time
              self.resize(false);
              // if (!self.user.username) return self.setCurrentModal('username-modal');
            } else {
              if (self.page.display_name) { // If the account exists in our system
                self.setCurrentModal('switch-or-merge-modal');
              } else {
                self.setCurrentModal('add-provider-modal');
              }
            }
          } else { // The account is not signed in
            if (self.page.display_name) { // If the account exists in our system
              self.setCurrentModal('login-modal');
            } else {
              self.setCurrentModal('new-or-link-modal');
            }
          }
        });
      });
    });

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
    tipping: function () {
      this.messenger.post('tipping', true);
    },
    resize: function (full) {
      var self = this;
      var toolbar = this.$el.querySelector('.toolbar');
      Vue.nextTick(function () {
        self.messenger.post('size', {
          width: full ? '100%' : toolbar.scrollWidth + 10 + 'px',
          height: full ? '100%' : toolbar.scrollHeight + 10 + 'px'
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
    logOut: function () {
      var self = this;
      if (JSON.stringify(this.user) === '{}') return this.messenger.post('destroy');
      http('GET', '/logout', null, function (err, response) {
        if (err) return modalErrorHandler(err, response);
        return self.messenger.post('destroy');
      });
    },
    destroy: function () {
      this.messenger.post('destroy');
    }
  }
});