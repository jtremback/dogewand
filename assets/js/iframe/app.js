'use strict';

/*global Vue*/

var PROVIDER_ORIGIN = 'https://www.facebook.com/'; // Will need to use postMessage here instead.


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
  created: function () {
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
  created: function () {
    var self = this;
    self.$watch('show', function (bool) {
      self.$dispatch('show', bool);
    });
  }
});


new Vue({
  el: '#app',
  data: {
    sir_modal: false
  },
  ready: function () {
    var self = this;
    var resize = function (full) {
      console.log('resize', full, self.$el.offsetHeight, self.$el.offsetWidth);
      // parent.postMessage(JSON.stringify({
      //   method: 'size',
      //   data: {
      //     width: full ? '100%' : self.$el.offsetHeight + 'px',
      //     height: full ? '100%' : self.$el.offsetWidth + 'px'
      //   }
      // }), PROVIDER_ORIGIN);
    };

    this.$on('show', resize);
  }
});

